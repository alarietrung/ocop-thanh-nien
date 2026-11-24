import { create } from '../vendor/qr-core';

export function buildTraceQrSvgDataUri(payload) {
  try {
    const { modules } = create(payload,{errorCorrectionLevel:'M'});
    const margin=4;
    const size=modules.size+2*margin;
    const paths=[];
    for(let y=0;y<modules.size;y++){
      for(let x=0;x<modules.size;x++){
        if(modules.get(y,x)) paths.push('M'+(x+margin)+' '+(y+margin)+'h1v1h-1z');
      }
    }
    const svg='<svg xmlns="http://www.w3.org/2000/svg" role="img" viewBox="0 0 '+size+' '+size+'" shape-rendering="crispEdges"><rect width="'+size+'" height="'+size+'" fill="#fff"/><path fill="#08234b" d="'+paths.join('')+'"/></svg>';
    return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
  } catch {
    return '';
  }
}
