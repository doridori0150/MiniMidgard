import path from 'node:path';
import {root,ref,order,read,save,blank,paste,scale,crop} from './work.mjs';
const ids=['attack_1_wind_up','attack_2_apex','attack_5_swing','attack_3_contact','attack_4_recovery'];
const sheet=blank(1536,240);paste(sheet,ref);ids.forEach((id,j)=>paste(sheet,read(path.join(root,id,'composite.png')),(j+1)*256));
save(path.join(root,'keyposes_attack.png'),sheet);save(path.join(root,'keyposes_attack_4x.png'),scale(sheet,4));
const pair=blank(512,1200),oldNames=['1_wind_up','2_apex','5_swing','3_contact','4_recovery'];
ids.forEach((id,j)=>{paste(pair,scale(read(path.resolve(root,'../../pixel-assassin-attack-keyposes/poses',oldNames[j],'composite.png')),2),0,j*240);paste(pair,read(path.join(root,id,'composite.png')),256,j*240);});
save(path.join(root,'side_by_side_attack.png'),pair);
const review=blank(960,112);[ref,...ids.map(id=>read(path.join(root,id,'composite.png')))].forEach((im,j)=>paste(review,crop(im,80,116,160,112),j*160));save(path.join(root,'review_attack_3x.png'),scale(review,3));
const layerReview=blank(800,224);for(const [j,id] of ['attack_5_swing','attack_3_contact'].entries())for(const [i,n] of order.entries())paste(layerReview,crop(read(path.join(root,id,n+'.png')),80,116,160,112),i*160,j*112);save(path.join(root,'review_layers_3x.png'),scale(layerReview,3));
const sequence=blank(450,98);for(const [j,id] of ['attack_2_apex','attack_5_swing','attack_3_contact'].entries())paste(sequence,crop(read(path.join(root,id,'composite.png')),90,130,150,98),j*150);save(path.join(root,'backleg_sequence_review.png'),scale(sequence,4));
const comparison=blank(300,196);for(const [j,id] of ['attack_5_swing','attack_3_contact'].entries()){
 paste(comparison,crop(read(path.join(root,'rejected',id+'_backleg_previous/composite.png')),90,130,150,98),0,j*98);
 paste(comparison,crop(read(path.join(root,id,'composite.png')),90,130,150,98),150,j*98);
}save(path.join(root,'backleg_before_after_4x.png'),scale(comparison,4));
console.log('공격 시트·판정판·검수 이미지 갱신 완료');
