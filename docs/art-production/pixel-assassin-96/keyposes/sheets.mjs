import fs from 'node:fs';import path from 'node:path';
import{root,project,ref,order,read,save,blank,paste,scale,crop}from './work.mjs';
export const motions={idle:['idle_1_breath_out'],walk:['walk_1_contact_near','walk_2_pass_near','walk_3_contact_far','walk_4_pass_far'],attack:['attack_1_wind_up','attack_2_apex','attack_5_swing','attack_3_contact','attack_4_recovery']};
for(const [motion,ids]of Object.entries(motions)){
 const a=blank(256*(ids.length+1),240);paste(a,ref);ids.forEach((id,j)=>paste(a,read(path.join(root,id,'composite.png')),(j+1)*256));save(path.join(root,'keyposes_'+motion+'.png'),a);save(path.join(root,'keyposes_'+motion+'_4x.png'),scale(a,4));
 const details=blank(160*(ids.length+1),112);[ref,...ids.map(id=>read(path.join(root,id,'composite.png')))].forEach((im,j)=>paste(details,crop(im,80,116,160,112),j*160));save(path.join(root,'review_'+motion+'_3x.png'),scale(details,3));
}
const oldNames=['1_wind_up','2_apex','5_swing','3_contact','4_recovery'],pair=blank(512,240*5);
motions.attack.forEach((id,j)=>{paste(pair,scale(read(path.resolve(root,'../../pixel-assassin-attack-keyposes/poses',oldNames[j],'composite.png')),2),0,j*240);paste(pair,read(path.join(root,id,'composite.png')),256,j*240);});save(path.join(root,'side_by_side_attack.png'),pair);
const layerReview=blank(800,224);for(const [j,id]of['attack_5_swing','attack_3_contact'].entries())for(const [i,n]of order.entries())paste(layerReview,crop(read(path.join(root,id,n+'.png')),80,116,160,112),i*160,j*112);save(path.join(root,'review_layers_3x.png'),scale(layerReview,3));
