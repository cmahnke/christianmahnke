interface LinkedArtEntity {
    id?: string;
    _label?: string;
    content?: string;
    type?: string;
    name?: string;
    digitally_shown_by?: LinkedArtEntity[];
    access_point?: LinkedArtEntity[];
    transferred_title_from?: LinkedArtEntity[] | LinkedArtEntity;
    transferred_title_to?: LinkedArtEntity[] | LinkedArtEntity;
    timespan?: LinkedArtEntity;
    [key: string]: any;
}

interface LinkedArtObject extends LinkedArtEntity {
    representation?: LinkedArtEntity[];
    identified_by?: LinkedArtEntity[] | LinkedArtEntity;
    produced_by?: LinkedArtEntity;
    classified_as?: LinkedArtEntity[] | LinkedArtEntity;
    referred_to_by?: LinkedArtEntity[] | LinkedArtEntity;
    subject_of?: LinkedArtEntity[] | LinkedArtEntity;
    current_owner?: LinkedArtEntity[] | LinkedArtEntity;
    changed_ownership?: LinkedArtEntity[];
    rights?: string | LinkedArtEntity;
    subject_to?: LinkedArtEntity[] | LinkedArtEntity;
    changed_ownership_through?: LinkedArtEntity[] | LinkedArtEntity;
}

async function fetchData(): Promise<void> {
    const urlInput = document.getElementById('urlInput') as HTMLInputElement;
    const output = document.getElementById('output') as HTMLDivElement;
    const errorDisplay = document.getElementById('errorDisplay') as HTMLDivElement;
    const jsonOutput = document.getElementById('jsonOutput') as HTMLPreElement;
    const toggleBtn = document.getElementById('toggleJson') as HTMLButtonElement;

    if (!urlInput || !output || !errorDisplay) return;

    output.style.display = 'none';
    errorDisplay.style.display = 'none';
    if (jsonOutput) jsonOutput.style.display = 'none';
    if (toggleBtn) toggleBtn.style.display = 'none';

    const url = urlInput.value;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data: LinkedArtObject = await response.json();

        renderLinkedArt(data);
        renderRawJson(data);
    } catch (e: any) {
        errorDisplay.textContent = "Error: " + e.message + " (Check CORS settings on the source URL)";
        errorDisplay.style.display = 'block';
    }
}

function renderLinkedArt(data: LinkedArtObject): void {
    const output = document.getElementById('output') as HTMLDivElement;
    if (!output) return;

    output.innerHTML = `<h3>${data._label || 'Untitled Object'}</h3>`;

    if (data.representation && data.representation.length > 0) {
        data.representation.forEach((rep: LinkedArtEntity) => {
            const imgUrls: string[] = [];

            // Check for nested image structure (Visual Item -> Digital Object -> Access Point)
            if (rep.digitally_shown_by && rep.digitally_shown_by.length > 0) {
                rep.digitally_shown_by.forEach(digital => {
                    if (digital.access_point && digital.access_point.length > 0) {
                        digital.access_point.forEach(ap => {
                            if (ap.id) imgUrls.push(ap.id);
                        });
                    } else if (digital.id) {
                        imgUrls.push(digital.id);
                    }
                });
            } else if (rep.id) {
                // Fallback: Direct ID on representation
                imgUrls.push(rep.id);
            }

            imgUrls.forEach(url => {
                if (url.endsWith('info.json')) {
                    const placeholder = document.createElement('div');
                    placeholder.style.marginBottom = '15px';
                    placeholder.style.padding = '10px';
                    placeholder.style.background = '#eee';
                    placeholder.style.borderRadius = '4px';
                    placeholder.innerHTML = `🖼️ IIIF Image Endpoint: <a href="${url}" target="_blank">View Info</a>`;
                    output.prepend(placeholder);
                } else {
                    const img = document.createElement('img');
                    img.src = url;
                    img.style.maxWidth = '100%';
                    img.style.borderRadius = '4px';
                    img.style.marginBottom = '15px';
                    img.alt = rep._label || 'Object Image';
                    output.prepend(img); // Put image at the top
                }
            });
        });
    }

    const list = document.createElement('div');

    const addRow = (label: string, content: string) => {
        if (!content) return;
        const section = document.createElement('div');
        section.className = 'attr';
        section.innerHTML = `<span class="label">${label}:</span><span class="value">${content}</span>`;
        list.appendChild(section);
    };

    // 1. Production Metadata (Artist, Date, Technique)
    if (data.produced_by) {
        const production = data.produced_by;
        
        if (production.carried_out_by) {
            addRow('Artist/Maker', renderEntityList(production.carried_out_by));
        }
        
        if (production.timespan) {
            addRow('Date', renderEntityList(production.timespan));
        }

        if (production.technique) {
            addRow('Technique', renderEntityList(production.technique));
        }
    }

    if (data.classified_as) {
        addRow('Classification', renderEntityList(data.classified_as));
    }

    // 3. Current Owner
    if (data.current_owner) {
        addRow('Current Owner', renderEntityList(data.current_owner));
    }

    // 4. Ownership History (Provenance)
    if (data.changed_ownership) {
        addRow('Provenance', renderEntityList(data.changed_ownership));
    }

    // 5. Rights
    if (data.rights) {
        const r = data.rights;
        const val = (typeof r === 'string') ? `<a href="${r}" target="_blank">Rights Statement</a>` : renderEntityList(r as LinkedArtEntity);
        addRow('Rights', val);
    }

    // 6. Identifiers
    if (data.identified_by) {
        addRow('Identifiers', renderEntityList(data.identified_by));
    }

    // 7. References / Descriptions
    if (data.referred_to_by) {
        addRow('References', renderEntityList(data.referred_to_by));
    }

    // 8. Subject To
    if (data.subject_to) {
        const subjects = Array.isArray(data.subject_to) ? data.subject_to : [data.subject_to];
        const content = subjects.map(s => {
            let text = renderEntityLink(s);
            if (s.classified_as) {
                 const cList = Array.isArray(s.classified_as) ? s.classified_as : [s.classified_as];
                 const cLabels = cList.map(c => renderEntityLink(c)).filter(l => l).join(', ');
                 if (cLabels) text += ` <span style="color:#666; font-size:0.9em">(${cLabels})</span>`;
            }
            return `<div>${text}</div>`;
        }).join('');
        addRow('Subject To', content);
    }

    // 9. Ownership transfer
    if (data.changed_ownership_through) {
        const transfers = Array.isArray(data.changed_ownership_through) ? data.changed_ownership_through : [data.changed_ownership_through];
        const content = transfers.map(t => {
            let label = t._label || t.content || t.name || t.type || 'Unknown';
            let html = '';

            // Try to construct a better label if default is generic or unknown
            if (label === 'Unknown' || label === 'Activity' || label === 'Acquisition' || label === 'Transfer') {
                const parts: string[] = [];
                
                let typePart = t.type || 'Event';
                if (t.timespan && t.timespan._label) typePart += ` (${t.timespan._label})`;
                
                if (t.id && t.id.startsWith('http')) {
                    parts.push(`<a href="${t.id}" target="_blank">${typePart}</a>`);
                } else {
                    parts.push(typePart);
                }
                
                if (t.transferred_title_from) {
                    const from = Array.isArray(t.transferred_title_from) ? t.transferred_title_from : [t.transferred_title_from];
                    const fromName = from.map((e: LinkedArtEntity) => renderEntityLink(e)).join(', ');
                    if (fromName) parts.push(`from ${fromName}`);
                }
                
                if (t.transferred_title_to) {
                    const to = Array.isArray(t.transferred_title_to) ? t.transferred_title_to : [t.transferred_title_to];
                    const toName = to.map((e: LinkedArtEntity) => renderEntityLink(e)).join(', ');
                    if (toName) parts.push(`to ${toName}`);
                }
                
                html = parts.join(' ');
            } else {
                if (t.id && t.id.startsWith('http')) {
                    html = `<a href="${t.id}" target="_blank">${label}</a>`;
                } else {
                    html = label;
                }
            }

            return `<div style="margin-bottom: 4px;">${html}</div>`;
        }).join('');
        addRow('Ownership transfer', content);
    }

    output.appendChild(list);
    output.style.display = 'block';
}

function renderEntityLink(entity: LinkedArtEntity): string {
    const text = entity._label || entity.content || entity.name || entity.type || entity.id || 'Unknown';
    if (entity.id && entity.id.startsWith('http')) {
        return `<a href="${entity.id}" target="_blank">${text}</a>`;
    }
    return text;
}

function renderEntityList(data: LinkedArtEntity | LinkedArtEntity[]): string {
    if (!data) return '';
    const list = Array.isArray(data) ? data : [data];
    return list.map(renderEntityLink).join(', ');
}

function renderRawJson(data: LinkedArtObject): void {
    const jsonOutput = document.getElementById('jsonOutput') as HTMLPreElement;
    const toggleBtn = document.getElementById('toggleJson') as HTMLButtonElement;
    
    if (!jsonOutput || !toggleBtn) return;

    const json = JSON.stringify(data, null, 2);
    jsonOutput.innerHTML = syntaxHighlight(json);
    toggleBtn.style.display = 'block';
    toggleBtn.textContent = 'Show Raw JSON';
}

function toggleJson(): void {
    const jsonOutput = document.getElementById('jsonOutput') as HTMLPreElement;
    const toggleBtn = document.getElementById('toggleJson') as HTMLButtonElement;
    
    if (!jsonOutput || !toggleBtn) return;

    if (jsonOutput.style.display === 'none') {
        jsonOutput.style.display = 'block';
        toggleBtn.textContent = 'Hide Raw JSON';
    } else {
        jsonOutput.style.display = 'none';
        toggleBtn.textContent = 'Show Raw JSON';
    }
}

function syntaxHighlight(json: string): string {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        let cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}

// Expose to window for HTML onclick handler
(window as any).fetchData = fetchData;
(window as any).toggleJson = toggleJson;