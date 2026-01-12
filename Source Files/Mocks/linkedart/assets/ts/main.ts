interface LinkedArtEntity {
    id?: string;
    _label?: string;
    content?: string;
    type?: string;
    name?: string;
    digitally_shown_by?: LinkedArtEntity[];
    access_point?: LinkedArtEntity[];
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
}

async function fetchData(): Promise<void> {
    const urlInput = document.getElementById('urlInput') as HTMLInputElement;
    const output = document.getElementById('output') as HTMLDivElement;
    const errorDisplay = document.getElementById('errorDisplay') as HTMLDivElement;

    if (!urlInput || !output || !errorDisplay) return;

    output.style.display = 'none';
    errorDisplay.style.display = 'none';

    const url = urlInput.value;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data: LinkedArtObject = await response.json();

        renderLinkedArt(data);
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
                const img = document.createElement('img');
                img.src = url;
                img.style.maxWidth = '100%';
                img.style.borderRadius = '4px';
                img.style.marginBottom = '15px';
                img.alt = rep._label || 'Object Image';
                output.prepend(img); // Put image at the top
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

    // 2. Classification
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

    output.appendChild(list);
    output.style.display = 'block';
}

function renderEntityLink(entity: LinkedArtEntity): string {
    const text = entity._label || entity.content || entity.name || entity.id || 'Unknown';
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

// Expose to window for HTML onclick handler
(window as any).fetchData = fetchData;