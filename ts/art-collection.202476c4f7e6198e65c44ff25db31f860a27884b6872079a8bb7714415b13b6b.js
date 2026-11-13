var v={MIN_GAP_PX:25,TARGET_HEIGHT:280,CAPTION_HEIGHT_PX:28,PADDING:48};function B(l){let n=l>>>0;return()=>(n^=n<<13,n^=n>>17,n^=n<<5,(n>>>0)/4294967295)}var P=[{outer:"#5C3D0A",mid:"#8B6914",inner:"#C8A951",highlight:"#E8D080"},{outer:"#4A3008",mid:"#7A5C1A",inner:"#B08030",highlight:"#D4AA50"},{outer:"#3A3F48",mid:"#6B7280",inner:"#A8B4C0",highlight:"#D0DCE8"},{outer:"#1A0F08",mid:"#3D2B1F",inner:"#6B4028",highlight:"#8B5C38"},{outer:"#4A3020",mid:"#7A5030",inner:"#A87848",highlight:"#C89868"},{outer:"#1A0808",mid:"#4A1010",inner:"#7A2020",highlight:"#A04040"},{outer:"#2A1808",mid:"#6B3010",inner:"#9B5020",highlight:"#C07840"},{outer:"#0A0A0A",mid:"#2A2010",inner:"#7A6020",highlight:"#B89040"},{outer:"#7A7858",mid:"#A09870",inner:"#C8BC90",highlight:"#E8DEB0"},{outer:"#282830",mid:"#50505C",inner:"#888898",highlight:"#B8B8C8"}];function _(l){let n=B(l*6971+42),u=["solid","grooved","double"];return{paletteIndex:l%P.length,outerWidth:10+Math.floor(n()*22),innerWidth:3+Math.floor(n()*9),patternType:u[Math.floor(n()*u.length)]}}function W(l,n,u,s){let h="http://www.w3.org/2000/svg",{outerWidth:b,innerWidth:m,patternType:c,paletteIndex:E}=l,w=P[E],e=b+m,i=n+2*e,r=u+2*e,t=b,x=document.createElementNS(h,"svg");x.setAttribute("width",String(i)),x.setAttribute("height",String(r)),x.style.cssText=`
    position: absolute;
    top: 0; left: 0;
    pointer-events: none;
    z-index: 10;
    overflow: visible;
  `;let C=document.createElementNS(h,"defs");function f(d,o,a,p,y,I){let $=document.createElementNS(h,"linearGradient");$.setAttribute("id",d),$.setAttribute("x1",o),$.setAttribute("y1",a),$.setAttribute("x2",p),$.setAttribute("y2",y),$.setAttribute("gradientUnits","objectBoundingBox"),I.forEach(([N,k])=>{let L=document.createElementNS(h,"stop");L.setAttribute("offset",String(N)),L.setAttribute("stop-color",k),$.appendChild(L)}),C.appendChild($)}let M=w.highlight,T=w.mid,S=w.outer,g=w.inner;f(`gt${s}`,"0","0","0","1",[[0,M],[.45,g],[1,T]]),f(`gb${s}`,"0","0","0","1",[[0,T],[.5,S],[1,S]]),f(`gl${s}`,"0","0","1","0",[[0,M],[.5,g],[1,T]]),f(`gr${s}`,"0","0","1","0",[[0,T],[.5,S],[1,S]]),f(`git${s}`,"0","0","0","1",[[0,g],[1,T]]),f(`gib${s}`,"0","0","0","1",[[0,T],[1,S]]),f(`gil${s}`,"0","0","1","0",[[0,g],[1,T]]),f(`gir${s}`,"0","0","1","0",[[0,T],[1,S]]),x.appendChild(C);function H(d,o,a=1){let p=document.createElementNS(h,"polygon");p.setAttribute("points",d.map(([y,I])=>`${y},${I}`).join(" ")),p.setAttribute("fill",o),p.setAttribute("opacity",String(a)),x.appendChild(p)}function A(d,o,a,p=1){let y=document.createElementNS(h,"polyline");y.setAttribute("points",d.map(([I,$])=>`${I},${$}`).join(" ")),y.setAttribute("fill","none"),y.setAttribute("stroke",o),y.setAttribute("stroke-width",String(a)),y.setAttribute("opacity",String(p)),x.appendChild(y)}if(H([[0,0],[i,0],[i-t,t],[t,t]],`url(#gt${s})`),H([[0,r],[i,r],[i-t,r-t],[t,r-t]],`url(#gb${s})`),H([[0,0],[t,t],[t,r-t],[0,r]],`url(#gl${s})`),H([[i,0],[i-t,t],[i-t,r-t],[i,r]],`url(#gr${s})`),H([[t,t],[i-t,t],[i-e,e],[e,e]],`url(#git${s})`),H([[t,r-t],[i-t,r-t],[i-e,r-e],[e,r-e]],`url(#gib${s})`),H([[t,t],[e,e],[e,r-e],[t,r-t]],`url(#gil${s})`),H([[i-t,t],[i-e,e],[i-e,r-e],[i-t,r-t]],`url(#gir${s})`),c==="grooved")for(let d=1;d<=3;d++){let o=d/4*t,a=d%2===0?"rgba(0,0,0,1)":"rgba(255,255,255,1)",p=d%2===0?.2:.13;A([[o,o],[i-o,o]],a,.7,p),A([[o,r-o],[i-o,r-o]],a,.7,p),A([[o,o],[o,r-o]],a,.7,p),A([[i-o,o],[i-o,r-o]],a,.7,p)}return c==="double"&&[.28,.52].forEach((d,o)=>{let a=d*t,p=o===0?M:S,y=o===0?.5:.3;A([[a,a],[i-a,a],[i-a,r-a],[a,r-a],[a,a]],p,1.1,y)}),A([[0,0],[i,0]],"rgba(255,255,255,0.28)",1.2),A([[0,0],[0,r]],"rgba(255,255,255,0.18)",1),A([[i,0],[i,r]],"rgba(0,0,0,0.38)",1.2),A([[0,r],[i,r]],"rgba(0,0,0,0.38)",1.2),A([[e,e],[i-e,e]],"rgba(0,0,0,0.42)",1.4),A([[e,e],[e,r-e]],"rgba(0,0,0,0.28)",1),A([[i-e,e],[i-e,r-e]],"rgba(255,255,255,0.10)",.8),A([[e,r-e],[i-e,r-e]],"rgba(255,255,255,0.10)",.8),x}function F(l,n){let u=document.createElement("div");return u.className="ph-shadow",u.style.cssText=`
    position: absolute;
    top: 0; left: 0;
    width:  ${l}px;
    height: ${n}px;
    box-shadow:
      0  2px  6px  2px rgba(0,0,0,0.30),
      0  5px 16px  4px rgba(0,0,0,0.20),
      0 10px 32px  8px rgba(0,0,0,0.12);
    z-index: 0;
    pointer-events: none;
  `,u}function q(){let l=[];return document.querySelectorAll(".post").forEach(n=>{let u=n.querySelector(".post-preview picture");if(!u)return;let s=parseInt(u.getAttribute("data-width")||"1",10),h=parseInt(u.getAttribute("data-height")||"1",10),b=u.querySelector("img"),m=u.querySelector("a"),c=n.querySelector(".sub-title"),E=n.previousElementSibling?.getAttribute("id")??"";b&&l.push({width:s,height:h,aspectRatio:s/h,title:b.alt,href:m?.href??"#",imgSrc:b.src,imgAlt:b.alt,subTitle:c?.textContent?.trim()??"",id:E,postEl:n})}),l}function D(l){let n=_(l);return n.outerWidth+n.innerWidth}function R(l,n,u){let s=l.map((m,c)=>{let E=D(c);return m.aspectRatio*u+2*E}),h=[],b=0;for(;b<l.length;){let m=b+1;for(;m<l.length&&!(s.slice(b,m+1).reduce((C,f)=>C+f,0)+(m-b)*v.MIN_GAP_PX>n);)m++;let c=l.slice(b,m),w=s.slice(b,m).reduce((x,C)=>x+C,0),e=w+(c.length-1)*v.MIN_GAP_PX,i=m>=l.length,r=e/n,t=i&&r<.6?1:(n-(c.length-1)*v.MIN_GAP_PX)/w;h.push({artworks:c,rowHeight:u*t}),b=m}return h}function X(l,n){let u=n.clientWidth,s=Math.min(v.TARGET_HEIGHT,u*.35),h=R(l,u,s),b=v.MIN_GAP_PX+v.CAPTION_HEIGHT_PX;n.querySelectorAll(".ph-shadow, .ph-frame").forEach(c=>c.remove()),n.querySelectorAll(".ph-row").forEach(c=>{for(;c.firstChild;)n.insertBefore(c.firstChild,c);c.remove()}),l.forEach(({postEl:c})=>{c.style.cssText="",c.onmouseenter=null,c.onmouseleave=null}),n.style.cssText=`
    width: 100%;
    box-sizing: border-box;
    padding: ${v.PADDING}px 0 ${v.PADDING*1.5}px;
    overflow: visible;
    display: block;
  `;let m=0;h.forEach(c=>{let E=document.createElement("div");E.className="ph-row",E.style.cssText=`
      display: flex;
      justify-content: center;
      align-items: flex-end;
      gap: ${v.MIN_GAP_PX}px;
      margin-bottom: ${b}px;
      overflow: visible;
    `;let w=c.artworks.length;c.artworks.forEach((e,i)=>{let r=_(m),t=r.outerWidth+r.innerWidth,C=1+(w>1?Math.abs(i-(w-1)/2)/((w-1)/2):0)*.07,f=c.rowHeight*C,M=e.aspectRatio*f,T=M+2*t,S=f+2*t,g=e.postEl,H=S+v.CAPTION_HEIGHT_PX;g.style.cssText=`
        position: relative;
        flex-shrink: 0;
        width:  ${T}px;
        height: ${H}px;
        overflow: visible;
        cursor: pointer;
        transition: transform 0.35s ease;
      `,g.addEventListener("mouseenter",()=>{g.style.transform="translateY(-3px) scale(1.015)"}),g.addEventListener("mouseleave",()=>{g.style.transform=""}),g.insertBefore(F(T,S),g.firstChild);let A=g.querySelector(".post-body");A&&(A.style.display="none");let d=g.querySelector(".post-preview");if(d){g.appendChild(d),d.setAttribute("id",e.id),d.style.cssText=`
          position: absolute;
          top:  ${t}px;
          left: ${t}px;
          width:  ${M}px;
          height: ${f}px;
          overflow: hidden;
          z-index: 1;
          margin: 0;
          padding: 0;
        `;let a=d.querySelector("picture");a&&(a.style.cssText=`
            display: block;
            width:  ${M}px;
            height: ${f}px;
          `);let p=d.querySelector("img");p&&(p.style.cssText=`
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          `);let y=d.querySelector(".sub-title");y&&(g.appendChild(y),y.style.cssText=`
            position: absolute;
            top:   ${S+6}px;
            left:  0;
            width: ${T}px;
            height: ${v.CAPTION_HEIGHT_PX}px;
            text-align: center;
            font-size: 1.2rem;
            font-style: italic;
            letter-spacing: 0.04em;
            color: #383838;
            text-overflow: ellipsis;
            z-index: 5;
            margin: 0;
            padding: 0;
            display: block;
            mix-blend-mode: darken;
          `)}let o=W(r,M,f,m);o.classList.add("ph-frame"),g.appendChild(o),E.appendChild(g),m++}),n.appendChild(E)})}function G(){document.querySelectorAll(".artist-header, .post-title, .post-summary").forEach(h=>h.style.display="none");let l=document.querySelector(".posts");if(!l)return;let n=q();if(n.length===0)return;let u=()=>X(n,l);u(),document.querySelectorAll(".artist-header").forEach(h=>h.remove());let s;window.addEventListener("resize",()=>{clearTimeout(s),s=setTimeout(u,250)})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",G):G();
