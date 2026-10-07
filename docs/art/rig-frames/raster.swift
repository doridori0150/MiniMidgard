import AppKit
import Foundation
import ImageIO
let root = URL(fileURLWithPath: CommandLine.arguments[1])
func load(_ path: String) -> CGImage {
 let u = path.hasPrefix("/") ? URL(fileURLWithPath:path) : root.appendingPathComponent(path)
 return CGImageSourceCreateImageAtIndex(CGImageSourceCreateWithURL(u as CFURL,nil)!,0,nil)!
}
func context(_ w:Int,_ h:Int) -> CGContext { CGContext(data:nil,width:w,height:h,bitsPerComponent:8,bytesPerRow:w*4,space:CGColorSpaceCreateDeviceRGB(),bitmapInfo:CGImageAlphaInfo.premultipliedLast.rawValue)! }
func save(_ im:CGImage,_ path:String) { let url=root.appendingPathComponent(path); try! FileManager.default.createDirectory(at:url.deletingLastPathComponent(),withIntermediateDirectories:true); let d=CGImageDestinationCreateWithURL(url as CFURL,"public.png" as CFString,1,nil)!; CGImageDestinationAddImage(d,im,nil); CGImageDestinationFinalize(d) }
func draw(_ c:CGContext,_ im:CGImage,_ x:Double,_ y:Double,_ w:Double,_ h:Double) { c.saveGState(); c.translateBy(x:x,y:y+h); c.scaleBy(x:1,y:-1); c.draw(im,in:CGRect(x:0,y:0,width:w,height:h)); c.restoreGState() }
let jobs = try! JSONSerialization.jsonObject(with:Data(contentsOf:root.appendingPathComponent(CommandLine.arguments[2]))) as! [[String:Any]]
var report:[[String:Any]]=[]
for j in jobs {
 let type=j["op"] as! String
 if type=="process" {
  let source=load(j["source"] as! String), r=j["rect"] as! [Int]
  let cropped=source.cropping(to:CGRect(x:r[0],y:r[1],width:r[2],height:r[3]))!
  let inputRep=NSBitmapImageRep(cgImage:cropped)
  let rep=NSBitmapImageRep(bitmapDataPlanes:nil,pixelsWide:cropped.width,pixelsHigh:cropped.height,bitsPerSample:8,samplesPerPixel:4,hasAlpha:true,isPlanar:false,colorSpaceName:.deviceRGB,bytesPerRow:cropped.width*4,bitsPerPixel:32)!
  func inside(_ x:Double,_ y:Double,_ poly:[[Double]]) -> Bool {
   var hit=false; var k=poly.count-1
   for i in 0..<poly.count { let a=poly[i],b=poly[k]; if (a[1]>y) != (b[1]>y) && x < (b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0] { hit = !hit }; k=i }; return hit
  }
  let palette=j["palette"] as? [[Double]]
  let include=j["include"] as? [[Double]], exclude=j["exclude"] as? [[[Double]]]
  for y in 0..<rep.pixelsHigh { for x in 0..<rep.pixelsWide {
   let col=inputRep.colorAt(x:x,y:y)!.usingColorSpace(.deviceRGB)!
   var rr=col.redComponent*255, gg=col.greenComponent*255, bb=col.blueComponent*255, aa=col.alphaComponent
   if j["keyGreen"] as? Bool == true && gg>rr-3 && gg>bb+9 { aa=0 }
   if j["inkOnly"] as? Bool == true { if rr>110 || gg>100 || bb>90 { aa=0 } }
   if j["faceInk"] as? Bool == true { if !(rr<110 && gg<100 && bb<90) && !(bb>rr+40 && gg>rr+25) { aa=0 } }
   if let boxes=j["eraseInkRects"] as? [[Int]] { for b in boxes { if x+r[0]>=b[0] && x+r[0]<b[0]+b[2] && y+r[1]>=b[1] && y+r[1]<b[1]+b[3] { rr=255;gg=229;bb=199 } } }
   if let p=include, !inside(Double(x+r[0])+0.5,Double(y+r[1])+0.5,p) { aa=0 }
   if let ps=exclude { for p in ps { if inside(Double(x+r[0])+0.5,Double(y+r[1])+0.5,p) { aa=0 } } }
   if let pal=palette, aa>0.01 { let skin=j["flatSkin"] as? Bool == true && rr>215 && gg>165 && bb>125 && rr-gg>10 && gg-bb>13; let best=skin ? [255.0,229.0,199.0] : pal.min { a,b in pow(a[0]-rr,2)+pow(a[1]-gg,2)+pow(a[2]-bb,2) < pow(b[0]-rr,2)+pow(b[1]-gg,2)+pow(b[2]-bb,2) }!; rr=best[0];gg=best[1];bb=best[2] }
   rep.setColor(NSColor(deviceRed:rr/255,green:gg/255,blue:bb/255,alpha:aa),atX:x,y:y)
  } }
  var out=rep.cgImage!
  if let s=j["size"] as? [Int] { let c=context(s[0],s[1]);c.interpolationQuality = .high;c.draw(out,in:CGRect(x:0,y:0,width:s[0],height:s[1]));out=c.makeImage()! }
  save(out,j["file"] as! String)
 } else if type=="gif" {
  let files=j["frames"] as! [String], url=root.appendingPathComponent(j["file"] as! String)
  let dest=CGImageDestinationCreateWithURL(url as CFURL,"com.compuserve.gif" as CFString,files.count,nil)!
  CGImageDestinationSetProperties(dest,[kCGImagePropertyGIFDictionary:[kCGImagePropertyGIFLoopCount:0]] as CFDictionary)
  for f in files { CGImageDestinationAddImage(dest,load(f),[kCGImagePropertyGIFDictionary:[kCGImagePropertyGIFDelayTime:j["delay"] as! Double]] as CFDictionary) }
  CGImageDestinationFinalize(dest)
 } else if type=="landmarks" {
  let im=load(j["file"] as! String),rep=NSBitmapImageRep(cgImage:im)
  var points:[[Double]]=[]
  for p in j["points"] as! [[Int]] { var sx=0.0,sy=0.0,n=0.0
   for y in max(0,p[1]-24)..<min(im.height,p[1]+25) { for x in max(0,p[0]-24)..<min(im.width,p[0]+25) {
    let c=rep.colorAt(x:x,y:y)!.usingColorSpace(.deviceRGB)!
    if c.alphaComponent>0.9 && c.redComponent>0.88 && c.greenComponent>0.72 && c.blueComponent>0.55 && c.redComponent-c.blueComponent>0.1 { sx += Double(x);sy += Double(y);n += 1 }
   } }; points.append(n>0 ? [sx/n,sy/n,n] : [Double(p[0]),Double(p[1]),0])
  };report.append(["file":j["file"]!,"points":points])
 } else if type=="analyze" {
  let im=load(j["file"] as! String), rep=NSBitmapImageRep(cgImage:im)
  var minx=im.width,miny=im.height,maxx = -1,maxy = -1, opaque=0
  for y in 0..<im.height { for x in 0..<im.width { if rep.colorAt(x:x,y:y)!.alphaComponent > 0.1 { minx=min(minx,x);miny=min(miny,y);maxx=max(maxx,x);maxy=max(maxy,y);opaque += 1 } } }
  var entry:[String:Any] = ["file":j["file"]!,"bounds":[minx,miny,maxx+1,maxy+1],"pixels":opaque,"size":[im.width,im.height]]
  if let points=j["points"] as? [[Double]] { var samples:[[String:Any]]=[]
   for p in points { let px=Int(p[0].rounded()),py=Int(p[1].rounded());var nearest=100.0
    for y in max(0,py-16)..<min(im.height,py+17) { for x in max(0,px-16)..<min(im.width,px+17) { if rep.colorAt(x:x,y:y)!.alphaComponent>0.8 { nearest=min(nearest,hypot(Double(x)-p[0],Double(y)-p[1])) } } }
    let c=rep.colorAt(x:max(0,min(im.width-1,px)),y:max(0,min(im.height-1,py)))!.usingColorSpace(.deviceRGB)!
    samples.append(["point":p,"rgba":[c.redComponent,c.greenComponent,c.blueComponent,c.alphaComponent],"nearestOpaqueDistance":nearest])
   };entry["samples"]=samples
  }
  report.append(entry)
 } else if type=="extract" {
  let source=load(j["source"] as! String), r=j["rect"] as! [Int]
  var im=source.cropping(to:CGRect(x:r[0],y:r[1],width:r[2],height:r[3]))!
  let rep=NSBitmapImageRep(cgImage:im)
  var minx=im.width,miny=im.height,maxx=0,maxy=0
  var transparent=0
  for y in 0..<im.height { for x in 0..<im.width { if rep.colorAt(x:x,y:y)!.alphaComponent > 0.05 { minx=min(minx,x); miny=min(miny,y); maxx=max(maxx,x); maxy=max(maxy,y) } else { transparent += 1 } } }
  im=im.cropping(to:CGRect(x:minx,y:miny,width:maxx-minx+1,height:maxy-miny+1))!
  let s=j["size"] as! [Int], c=context(s[0],s[1]); c.interpolationQuality = .high; c.draw(im,in:CGRect(x:0,y:0,width:s[0],height:s[1])); let out=c.makeImage()!
  save(out,j["file"] as! String)
  report.append(["file":j["file"]!,"sourceBounds":[r[0]+minx,r[1]+miny,maxx-minx+1,maxy-miny+1],"size":s,"transparentSourcePixels":transparent])
 } else if type=="render" {
  let s=j["size"] as! [Int], c=context(s[0],s[1]); c.interpolationQuality = .high
  c.translateBy(x:0,y:Double(s[1])); c.scaleBy(x:1,y:-1)
  if let bg=j["background"] as? [Double] { c.setFillColor(CGColor(red:bg[0],green:bg[1],blue:bg[2],alpha:1)); c.fill(CGRect(x:0,y:0,width:s[0],height:s[1])) }
  for item in j["draws"] as! [[String:Any]] {
   c.saveGState()
   if let mat=item["matrix"] as? [Double] { c.concatenate(CGAffineTransform(a:mat[0],b:mat[1],c:mat[2],d:mat[3],tx:mat[4],ty:mat[5])) }
   let im=load(item["file"] as! String)
  if let color=item["tint"] as? [Double] {
    let rep=NSBitmapImageRep(cgImage:im)
    for y in 0..<im.height { for x in 0..<im.width { let p=rep.colorAt(x:x,y:y)!.usingColorSpace(.deviceRGB)!; if p.redComponent>0.5 { rep.setColor(NSColor(deviceRed:p.redComponent*color[0],green:p.greenComponent*color[1],blue:p.blueComponent*color[2],alpha:p.alphaComponent),atX:x,y:y) } } }
    draw(c,rep.cgImage!,0,0,Double(im.width),Double(im.height))
   } else { draw(c,im,0,0,Double(im.width),Double(im.height)) }
   c.restoreGState()
  }
  if let labels=j["labels"] as? [[String:Any]] { NSGraphicsContext.saveGraphicsState(); NSGraphicsContext.current=NSGraphicsContext(cgContext:c,flipped:true); for l in labels { let p=l["at"] as! [Double]; (l["text"] as! NSString).draw(at:NSPoint(x:p[0],y:p[1]),withAttributes:[.font:NSFont.systemFont(ofSize:l["size"] as? Double ?? 15),.foregroundColor:NSColor(calibratedRed:0.23,green:0.19,blue:0.15,alpha:1)]) }; NSGraphicsContext.restoreGraphicsState() }
  save(c.makeImage()!,j["file"] as! String)
 }
}
let data=try! JSONSerialization.data(withJSONObject:report,options:[.prettyPrinted,.sortedKeys]); if report.count > 1 { try! data.write(to:root.appendingPathComponent("verification/raster_report.json")) }
