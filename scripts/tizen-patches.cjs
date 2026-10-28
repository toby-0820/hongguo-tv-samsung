'use strict';
function once(source,from,to){
 if(source.indexOf(from)<0 || source.indexOf(from)!==source.lastIndexOf(from))throw new Error('Upstream patch anchor changed');
 return source.replace(from,to);
}
function patchApp(source){
 source=once(source,'var n=t.data||t;return n.path','var n=t.data||t;if(n.notice)fa(n.notice);return n.path');
 source=once(source,'prefetch_after_seconds:"mpv"===ss()?1:5','prefetch_after_seconds:2');
 source=once(source,'window.HongguoTV={prepareExit:','window.HongguoTV={channelStep:function(direction){if(c||re||Zn||Jn||me||wo()||ne||J||qt||Dt||Ht||ce||ia()||(Ti&&Ti.isOpen()))return false;return ma(direction,true,true);},prepareExit:');
 source=once(source,'function ma(e,t){var n="player"===fo(),i="recommend"===fo()&&u.classList.contains("is-cinema");','function ma(e,t,channel){var n="player"===fo(),i="recommend"===fo()&&(channel||u.classList.contains("is-cinema"));');
 // Reject hidden and out-of-scope elements before requesting computed styles.
 source=once(source,'var t=window.getComputedStyle(e),i=e.closest&&e.closest("#detail-modal");','var t,i=e.closest&&e.closest("#detail-modal");');
 source=once(source,'e.getClientRects&&e.getClientRects().length&&(e.disabled||"none"===t.display||"hidden"===t.visibility||n.push(e))','e.getClientRects&&e.getClientRects().length&&!e.disabled&&(t=window.getComputedStyle(e),"none"===t.display||"hidden"===t.visibility||n.push(e))');
 return source;
}
const performanceCss=`
/* Tizen 5.5: keep directional focus immediate and avoid large filtered layers. */
*,*::before,*::after{scroll-behavior:auto!important;transition:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
.hero-backdrop,.hero-loading-poster{filter:none!important}
.catalog-card,.new-card{box-shadow:none!important}
.catalog-card.is-focused,.catalog-card:focus,.side-item.is-focused,.side-item:focus{transform:none!important}
`;
module.exports={patchApp,performanceCss};

