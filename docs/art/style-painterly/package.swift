// Deterministic packaging only: whole-image scaling/alignment, atlas key normalization,
// exact engine-layout cuts, and previews. No painted body parts are assembled.
import AppKit
import ImageIO
import Foundation
let root = URL(fileURLWithPath: CommandLine.arguments[1])
func load(_ p:String)->CGImage { CGImageSourceCreateImageAtIndex(CGImageSourceCreateWithURL(root.appendingPathComponent(p) as CFURL,nil)!,0,nil)! }
func save(_ im:CGImage,_ p:String) {
 let u=root.appendingPathComponent(p)
 try! FileManager.default.createDirectory(at:u.deletingLastPathComponent(),withIntermediateDirectories:true)
 let d=CGImageDestinationCreateWithURL(u as CFURL,"public.png" as CFString,1,nil)!
 CGImageDestinationAddImage(d,im,nil); precondition(CGImageDestinationFinalize(d))
}
func json(_ v:Any,_ p:String) { try! JSONSerialization.data(withJSONObject:v,options:[.prettyPrinted,.sortedKeys,.withoutEscapingSlashes]).write(to:root.appendingPathComponent(p)) }
func ctx(_ w:Int,_ h:Int)->CGContext {
 let c=CGContext(data:nil,width:w,height:h,bitsPerComponent:8,bytesPerRow:w*4,space:CGColorSpace(name:CGColorSpace.sRGB)!,bitmapInfo:CGImageAlphaInfo.premultipliedLast.rawValue)!
 c.interpolationQuality = .high; c.translateBy(x:0,y:CGFloat(h));c.scaleBy(x:1,y:-1);return c
}
func draw(_ c:CGContext,_ im:CGImage,_ r:CGRect) {
 c.saveGState(); c.translateBy(x:r.minX,y:r.maxY);c.scaleBy(x:1,y:-1)
 c.draw(im,in:CGRect(x:0,y:0,width:r.width,height:r.height));c.restoreGState()
}
func label(_ c:CGContext,_ s:String,_ x:Double,_ y:Double,_ size:Double=22) {
 NSGraphicsContext.saveGraphicsState();NSGraphicsContext.current=NSGraphicsContext(cgContext:c,flipped:true)
 (s as NSString).draw(at:NSPoint(x:x,y:y),withAttributes:[.font:NSFont.systemFont(ofSize:size,weight:.medium),.foregroundColor:NSColor(red:0.19,green:0.16,blue:0.12,alpha:1)])
 NSGraphicsContext.restoreGraphicsState()
}
func fill(_ c:CGContext,_ r:CGRect,_ rgb:[CGFloat]){c.setFillColor(CGColor(red:rgb[0],green:rgb[1],blue:rgb[2],alpha:rgb.count>3 ? rgb[3]:1));c.fill(r)}
func rgba(_ im:CGImage)->NSBitmapImageRep {
 let rep=NSBitmapImageRep(cgImage:im)
 precondition(rep.samplesPerPixel==4 && rep.bitsPerSample==8 && !rep.bitmapFormat.contains(.alphaFirst))
 return rep
}
func bounds(_ im:CGImage,_ threshold:UInt8=16,_ yFrom:Int=0)->CGRect {
 let r=rgba(im),d=r.bitmapData!;var x0=im.width,y0=im.height,x1=0,y1=0
 for y in yFrom..<im.height {for x in 0..<im.width {if d[y*r.bytesPerRow+x*4+3]>threshold {x0=min(x0,x);y0=min(y0,y);x1=max(x1,x+1);y1=max(y1,y+1)}}}
 precondition(x1>x0 && y1>y0);return CGRect(x:x0,y:y0,width:x1-x0,height:y1-y0)
}
func resized(_ im:CGImage,_ w:Int,_ h:Int)->CGImage {let c=ctx(w,h);draw(c,im,CGRect(x:0,y:0,width:w,height:h));return c.makeImage()!}
let names=["idle_0","idle_1","walk_0","walk_1","walk_2","walk_3","attack_0","attack_1","attack_2"]
let heights:[CGFloat]=[600,604,598,604,598,604,570,554,590]
var records:[[String:Any]]=[]
var sprites:[String:[CGImage]]=[:]
var animations:[String:Any]=[:]
for cls in ["novice","swordsman"] {
 var ims:[CGImage]=[]
 for (i,n) in names.enumerated() {
  let src=load("source/\(cls)_\(n).png"),b=bounds(src)
  // Foot-center = midpoint of the two-boot envelope in the bottom 18% of the figure.
  // Includes the raised boot during passing poses, so it does not snap to the support foot.
  let foot=bounds(src,64,Int(b.maxY-b.height*0.18))
  let sourceOrigin=CGPoint(x:foot.midX,y:b.maxY),k=heights[i]/b.height
  let tx=380-sourceOrigin.x*k,ty=680-sourceOrigin.y*k
  let c=ctx(1024,768)
  draw(c,src,CGRect(x:tx,y:ty,width:CGFloat(src.width)*k,height:CGFloat(src.height)*k))
  let im=c.makeImage()!,out="chars/\(cls)/\(n).png",ob=bounds(im)
  precondition(ob.minX>1 && ob.maxX<1023 && ob.minY>1 && ob.maxY<767,"Clipped \(out)")
  let rr=rgba(im),dd=rr.bitmapData!;var zero=0,partial=0,opaque=0,nearOpaque=0
  for y in 0..<im.height {for x in 0..<im.width {let a=dd[y*rr.bytesPerRow+x*4+3];if a>=250{nearOpaque+=1};if a==0{zero+=1}else if a==255{opaque+=1}else{partial+=1}}}
  precondition(zero>100000 && nearOpaque>5000,"Alpha check \(out): zero=\(zero), nearOpaque=\(nearOpaque)")
  save(im,out);ims.append(im)
  records.append(["file":out,"canvas":[1024,768],"bounds":[ob.minX,ob.minY,ob.maxX,ob.maxY],"sourceOrigin":[sourceOrigin.x,sourceOrigin.y],"sourceScale":k,"targetOrigin":[380,680],"height":heights[i],"transparentPixels":zero,"partialAlphaPixels":partial,"opaquePixels":opaque,"nearOpaquePixels":nearOpaque,"clipped":false])
 }
 sprites[cls]=ims
 var states:[String:Any]=[:]
 for (state,count,durs,loop) in [("idle",2,[800,800],true),("walk",4,[180,180,180,180],true),("attack",3,[100,80,100],false)] {
  var a:[String:Any]=["frames":(0..<count).map{"chars/\(cls)/\(state)_\($0).png"},"durations":durs,"loop":loop]
  if state=="attack" {a["contactFrame"]=1;a["contactTimeMs"]=140;a["contactFrameIntervalMs"]=[100,180]}
  states[state]=a
 }
 animations[cls]=states
}
// Integer 1280 atlas gives 640 ground squares and 320 prop cells.
let kitRep=rgba(resized(load("source/kit_meadow.png"),1280,1280)),kd=kitRep.bitmapData!
var normalizedKey=0
for y in 640..<1280 {for x in 0..<1280 {let i=y*kitRep.bytesPerRow+x*4
 let r=Int(kd[i]),g=Int(kd[i+1]),b=Int(kd[i+2])
 if min(r,b)-g>70 {kd[i]=255;kd[i+1]=0;kd[i+2]=255;kd[i+3]=255;normalizedKey+=1}
}}
let kit=kitRep.cgImage!;save(kit,"kit_meadow.png")
let propNames=["tree","pine","bush","rock","flowers","stump","fence","sign"]
var props:[String:CGImage]=[:],propChecks:[[String:Any]]=[]
for (i,name) in propNames.enumerated() {
 let rect=CGRect(x:(i%4)*320,y:640+(i/4)*320,width:320,height:320)
 let rep=rgba(kit.cropping(to:rect)!),d=rep.bitmapData!
 var borderNotKey=0
 for y in 0..<320 {for x in 0..<320 {
  let o=y*rep.bytesPerRow+x*4,r=Int(d[o]),g=Int(d[o+1]),b=Int(d[o+2]),m=min(r,b)-g
  if (x==0 || x==319 || y==0 || y==319) && !(r==255 && g==0 && b==255) {borderNotKey+=1}
  // Same magenta thresholds as tools/kit-export.html, no changes to that file.
  if m>70 {d[o]=0;d[o+1]=0;d[o+2]=0;d[o+3]=0}
  else if m>25 {
   let k=Double(m-25)/45,alpha=1-k*0.7
   d[o]=UInt8(max(0,Double(r)-Double(r-g)*k*0.8)*alpha)
   d[o+1]=UInt8(Double(g)*alpha)
   d[o+2]=UInt8(max(0,Double(b)-Double(b-g)*k*0.8)*alpha)
   d[o+3]=UInt8(255*alpha)
  }
 }}
 let cut=rep.cgImage!,b=bounds(cut,40),cropped=cut.cropping(to:b)!
 props[name]=cropped;save(cropped,"verification/kit/\(name).png")
 propChecks.append(["name":name,"cell":[Int(rect.minX),Int(rect.minY),320,320],"bounds":[b.minX,b.minY,b.maxX,b.maxY],"borderNonKeyPixels":borderNotKey])
 precondition(borderNotKey==0,"Prop reaches cell border: \(name)")
}
func ground(_ x:Int)->CGImage {
 let inset=12.8,patch=kit.cropping(to:CGRect(x:Double(x)+inset,y:inset,width:640-inset*2,height:640-inset*2))!,c=ctx(768,768)
 for fy in 0..<2 {for fx in 0..<2 {c.saveGState();c.translateBy(x:CGFloat(fx==1 ? 768:0),y:CGFloat(fy==1 ? 768:0));c.scaleBy(x:fx==1 ? -1:1,y:fy==1 ? -1:1);draw(c,patch,CGRect(x:0,y:0,width:384,height:384));c.restoreGState()}}
 return c.makeImage()!
}
let grass=ground(0),dirt=ground(640);save(grass,"verification/kit/grass.png");save(dirt,"verification/kit/dirt.png")
func tiled(_ c:CGContext,_ im:CGImage,_ r:CGRect,_ size:CGFloat=768) {
 c.saveGState();c.clip(to:r)
 var y=r.minY;while y<r.maxY {var x=r.minX;while x<r.maxX {draw(c,im,CGRect(x:x,y:y,width:size,height:size));x+=size};y+=size};c.restoreGState()
}
func prop(_ c:CGContext,_ name:String,_ x:CGFloat,_ groundY:CGFloat,_ h:CGFloat) {
 let im=props[name]!,w=h*CGFloat(im.width)/CGFloat(im.height);draw(c,im,CGRect(x:x-w/2,y:groundY-h,width:w,height:h))
}
// Full resolution contact sheet: every sprite appears unscaled (1x), plus all 18 at 80px nominal height.
let preview=ctx(3072,5520)
fill(preview,CGRect(x:0,y:0,width:3072,height:5520),[0.94,0.92,0.85])
label(preview,"PAINTERLY MEADOW / ORIGINAL STYLE PROBE",40,22,40)
label(preview,"All 18 whole-figure paintings  |  thin sepia ink + warm watercolor  |  original costumes",40,78,24)
label(preview,"80 px nominal character height / exact shared scale 80:600",40,124,25)
tiled(preview,grass,CGRect(x:24,y:170,width:3024,height:520),384)
tiled(preview,dirt,CGRect(x:24,y:316,width:3024,height:118),384)
prop(preview,"tree",105,388,220);prop(preview,"pine",2940,590,225)
prop(preview,"fence",2760,605,80);prop(preview,"bush",170,620,74)
for (ci,cls) in ["novice","swordsman"].enumerated() {
 let y=CGFloat(330+ci*230)
 for (i,im) in sprites[cls]!.enumerated() {
  let x=CGFloat(340+i*275),k:CGFloat=80/600
  draw(preview,im,CGRect(x:x-380*k,y:y-680*k,width:1024*k,height:768*k))
  label(preview,names[i],Double(x-38),Double(y+14),18)
 }
 label(preview,cls.uppercased(),40,Double(y-130),24)
}
label(preview,"1x source pixels below / open at 100% zoom; each character is about 600px tall",40,715,28)
for (ci,cls) in ["novice","swordsman"].enumerated() {
 for (i,im) in sprites[cls]!.enumerated() {
  let col=i%3,row=ci*3+i/3,x=CGFloat(col*1024),y=CGFloat(780+row*790)
  tiled(preview,grass,CGRect(x:x+8,y:y+8,width:1008,height:770))
  // Sparse matching props support scale without occluding any character.
  prop(preview,"flowers",x+85,y+730,78);prop(preview,i%2==0 ? "bush":"rock",x+932,y+736,95)
  draw(preview,im,CGRect(x:x,y:y,width:1024,height:768))
  fill(preview,CGRect(x:x+20,y:y+18,width:660,height:40),[0.96,0.95,0.88,0.93])
  label(preview,"\(cls.uppercased()) / \(names[i])   ·   1x",Double(x+32),Double(y+23),23)
 }
}
save(preview.makeImage()!,"preview.png")
save(resized(preview.makeImage()!,1024,1840),"verification/overview.png")
// Separate compact scene, useful for quick actual-size inspection.
let scene=ctx(1440,640);tiled(scene,grass,CGRect(x:0,y:0,width:1440,height:640),384)
tiled(scene,dirt,CGRect(x:0,y:235,width:1440,height:120),384)
prop(scene,"tree",130,320,300);prop(scene,"pine",1350,610,170);prop(scene,"fence",1170,580,80);prop(scene,"rock",260,570,90);prop(scene,"flowers",640,570,55)
for (ci,cls) in ["novice","swordsman"].enumerated(){for (i,im) in sprites[cls]!.enumerated(){let k:CGFloat=80/600,x=CGFloat(280+i*120),y=CGFloat(240+ci*180);draw(scene,im,CGRect(x:x-380*k,y:y-680*k,width:1024*k,height:768*k));label(scene,names[i],Double(x-35),Double(y+12),13)}}
fill(scene,CGRect(x:16,y:16,width:1030,height:58),[0.96,0.95,0.88,0.94]);label(scene,"80px VIEW  /  novice + swordsman  /  idle 2 · walk 4 · attack 3",30,30,23)
save(scene.makeImage()!,"verification/scene_80px.png")
json(["canvas":[1024,768],"origin":[380,680],"height":600,"units":"source pixels; durations in milliseconds; paths relative to manifest.json","frameIndexBase":0,"facing":"three-quarter right","animations":animations,"backgroundKit":["file":"kit_meadow.png","canvas":[1280,1280],"groundCell":[640,640],"propCell":[320,320],"key":"#FF00FF","propOrder":propNames],"preview":["file":"preview.png","sourceScale":1,"smallScale":80.0/600.0]],"manifest.json")
json(["frames":records,"props":propChecks,"kitKeyPixelsNormalized":normalizedKey,"frameCount":records.count,"attackAt140ms":1,"notes":"Technical checks only. Artistic consistency is reviewed in NOTES.md."],"verification/checks.json")
print("Packaged \(records.count) RGBA frames, 8 clean prop cells, kit, manifest and previews.")
