// Deterministic PNG/GIF raster backend. No network or generated art at runtime.
import AppKit
import Foundation
import ImageIO
let root=URL(fileURLWithPath:CommandLine.arguments[1])
func url(_ p:String)->URL { p.hasPrefix("/") ? URL(fileURLWithPath:p) : root.appendingPathComponent(p) }
var cache:[String:CGImage]=[:]
func load(_ p:String)->CGImage { if let im=cache[p] {return im};let im=CGImageSourceCreateImageAtIndex(CGImageSourceCreateWithURL(url(p) as CFURL,nil)!,0,nil)!;cache[p]=im;return im }
func resolved(_ n:[String:Any])->CGImage {
 let p=n["file"] as! String;var im=load(p)
 guard let tint=n["tint"] as? [Double] else {return im}
 let key=p+String(describing:tint);if let cached=cache[key] {return cached}
 let rep=NSBitmapImageRep(cgImage:im)
 for y in 0..<im.height {for x in 0..<im.width {let v=rep.colorAt(x:x,y:y)!.usingColorSpace(.deviceRGB)!;if v.redComponent*255>127 {rep.setColor(NSColor(deviceRed:v.redComponent*tint[0],green:v.greenComponent*tint[1],blue:v.blueComponent*tint[2],alpha:v.alphaComponent),atX:x,y:y)}}}
 im=rep.cgImage!;cache[key]=im;return im
}
func context(_ w:Int,_ h:Int)->CGContext {CGContext(data:nil,width:w,height:h,bitsPerComponent:8,bytesPerRow:w*4,space:CGColorSpaceCreateDeviceRGB(),bitmapInfo:CGImageAlphaInfo.premultipliedLast.rawValue)!}
func save(_ im:CGImage,_ p:String) {let u=url(p);try! FileManager.default.createDirectory(at:u.deletingLastPathComponent(),withIntermediateDirectories:true);let d=CGImageDestinationCreateWithURL(u as CFURL,"public.png" as CFString,1,nil)!;CGImageDestinationAddImage(d,im,nil);CGImageDestinationFinalize(d);cache[p]=im}
func draw(_ c:CGContext,_ im:CGImage,_ x:Double=0,_ y:Double=0,_ w:Double?=nil,_ h:Double?=nil) {let ww=w ?? Double(im.width),hh=h ?? Double(im.height);c.saveGState();c.translateBy(x:x,y:y+hh);c.scaleBy(x:1,y:-1);c.draw(im,in:CGRect(x:0,y:0,width:ww,height:hh));c.restoreGState()}
func color(_ a:[Double])->CGColor {CGColor(colorSpace:CGColorSpaceCreateDeviceRGB(),components:[a[0]/255,a[1]/255,a[2]/255,a.count>3 ? a[3]/255 : 1])!}
func dumped(_ im:CGImage,_ p:String) {let c=context(im.width,im.height);c.translateBy(x:0,y:Double(im.height));c.scaleBy(x:1,y:-1);draw(c,im);let data=Data(bytes:c.data!,count:im.width*im.height*4);try! data.write(to:url(p))}
let jobs=try! JSONSerialization.jsonObject(with:Data(contentsOf:url(CommandLine.arguments[2]))) as! [[String:Any]]
for j in jobs {
 let op=j["op"] as! String
 if op=="seamBatch" {
  let batches=j["batches"] as! [[String:Any]], variants=j["variants"] as! [String:[[[String:Any]]]]
  var failures:[[String:Any]]=[];var checked=0;var sampled=0;var badAlpha=0;var badWhite=0;var groups:[[String:Any]]=[]
  for batch in batches {
   let sz=batch["size"] as! [Int],nodes=batch["draws"] as! [[String:Any]], samples=batch["samples"] as! [[Int]], gender=batch["gender"] as! String
   // Visible material mask, composited in the same order. Cream hair may cross
   // the neck window; it is not a white neck seam. Body/head occlude rear hair.
   let material=context(sz[0],sz[1]);material.translateBy(x:0,y:Double(sz[1]));material.scaleBy(x:1,y:-1)
   for n in nodes {
    let role=n["role"] as! String;let isHair=role=="hair" || role=="hairBack";let path=n["file"] as! String;let key="matte:"+path+String(isHair)
    var im:CGImage
    if let saved=cache[key] {im=saved} else {let source=load(path);let m=context(source.width,source.height);m.draw(source,in:CGRect(x:0,y:0,width:source.width,height:source.height));m.setBlendMode(.sourceIn);m.setFillColor(CGColor(gray:isHair ? 1 : 0,alpha:1));m.fill(CGRect(x:0,y:0,width:source.width,height:source.height));im=m.makeImage()!;cache[key]=im}
    let a=n["matrix"] as! [Double];material.saveGState();material.concatenate(CGAffineTransform(a:a[0],b:a[1],c:a[2],d:a[3],tx:a[4],ty:a[5]));draw(material,im);material.restoreGState()
   }
   let materialBytes=material.data!.assumingMemoryBound(to:UInt8.self)
   var groupFails=0;var minAlpha=255;var groupAlpha=0;var groupWhite=0
   for (vi,variant) in variants[gender]!.enumerated() {
    let c=context(sz[0],sz[1]);c.translateBy(x:0,y:Double(sz[1]));c.scaleBy(x:1,y:-1);c.interpolationQuality = .high
    for original in nodes {
     var n=original
     if let replacement=variant.first(where: {($0["role"] as! String)==(original["role"] as! String)}) {n["file"]=replacement["file"]}
     let m=n["matrix"] as! [Double];c.saveGState();c.concatenate(CGAffineTransform(a:m[0],b:m[1],c:m[2],d:m[3],tx:m[4],ty:m[5]));draw(c,resolved(n));c.restoreGState()
    }
    // CGContext is top-down after the transform, matching PNG and manifest axes.
    let bytes=c.data!.assumingMemoryBound(to:UInt8.self);var ba=0;var bw=0
    for xy in samples {let k=(xy[1]*sz[0]+xy[0])*4;let a=Int(bytes[k+3]);minAlpha=min(minAlpha,a);if a<254 {ba += 1};if a>=254 && materialBytes[k]<128 && bytes[k]>245 && bytes[k+1]>240 && bytes[k+2]>220 {bw += 1}}
    checked += 1;sampled += samples.count;badAlpha += ba;badWhite += bw;groupAlpha += ba;groupWhite += bw
    if ba+bw>0 {groupFails += 1;if failures.count<24 {failures.append(["id":batch["id"]!,"variant":vi,"alphaPixels":ba,"whitePixels":bw])}}
   }
   groups.append(["id":batch["id"]!,"cases":variants[gender]!.count,"failedCases":groupFails,"minAlpha":minAlpha,"alphaPixels":groupAlpha,"whitePixels":groupWhite])
  }
  let report:[String:Any]=["cases":checked,"sampledPixels":sampled,"alphaFailures":badAlpha,"whiteFailures":badWhite,"failures":failures,"groups":groups]
  try! JSONSerialization.data(withJSONObject:report,options:[.prettyPrinted,.sortedKeys]).write(to:url(j["file"] as! String));continue
 }
 if op=="dump" {dumped(load(j["source"] as! String),j["file"] as! String);continue}
 if op=="gif" {let fs=j["frames"] as! [String];let d=CGImageDestinationCreateWithURL(url(j["file"] as! String) as CFURL,"com.compuserve.gif" as CFString,fs.count,nil)!;CGImageDestinationSetProperties(d,[kCGImagePropertyGIFDictionary:[kCGImagePropertyGIFLoopCount:0]] as CFDictionary);for f in fs {CGImageDestinationAddImage(d,load(f),[kCGImagePropertyGIFDictionary:[kCGImagePropertyGIFDelayTime:j["delay"] as! Double]] as CFDictionary)};CGImageDestinationFinalize(d);continue}
 if op=="raw" {let s=j["size"] as! [Int];let d=try! Data(contentsOf:url(j["source"] as! String));let provider=CGDataProvider(data:d as CFData)!;let im=CGImage(width:s[0],height:s[1],bitsPerComponent:8,bitsPerPixel:32,bytesPerRow:s[0]*4,space:CGColorSpaceCreateDeviceRGB(),bitmapInfo:CGBitmapInfo(rawValue:CGImageAlphaInfo.last.rawValue),provider:provider,decode:nil,shouldInterpolate:false,intent:.defaultIntent)!;save(im,j["file"] as! String);continue}
 let s=j["size"] as! [Int];let scale=j["supersample"] as? Int ?? 1;let c=context(s[0]*scale,s[1]*scale);c.interpolationQuality = .high;c.translateBy(x:0,y:Double(s[1]*scale));c.scaleBy(x:Double(scale),y:Double(-scale))
 if let bg=j["background"] as? [Double] {c.setFillColor(color(bg));c.fill(CGRect(x:0,y:0,width:s[0],height:s[1]))}
 if op=="render" {
  for n in j["draws"] as! [[String:Any]] {c.saveGState();let m=n["matrix"] as! [Double];c.concatenate(CGAffineTransform(a:m[0],b:m[1],c:m[2],d:m[3],tx:m[4],ty:m[5]));let im=resolved(n)
   draw(c,im);c.restoreGState()
  }
 } else if op=="vector" {
  for n in j["shapes"] as! [[String:Any]] {let p=CGMutablePath();if let e=n["ellipse"] as? [Double] {p.addEllipse(in:CGRect(x:e[0],y:e[1],width:e[2],height:e[3]))};if let cmds=n["path"] as? [[Any]] {for z in cmds {let v=z.dropFirst().map {($0 as! NSNumber).doubleValue};switch z[0] as! String {case "M":p.move(to:CGPoint(x:v[0],y:v[1]));case "L":p.addLine(to:CGPoint(x:v[0],y:v[1]));case "C":p.addCurve(to:CGPoint(x:v[4],y:v[5]),control1:CGPoint(x:v[0],y:v[1]),control2:CGPoint(x:v[2],y:v[3]));case "Q":p.addQuadCurve(to:CGPoint(x:v[2],y:v[3]),control:CGPoint(x:v[0],y:v[1]));case "Z":p.closeSubpath();default:fatalError("path")}}};if let f=n["fill"] as? [Double] {c.addPath(p);c.setFillColor(color(f));c.fillPath()};if let st=n["stroke"] as? [Double] {c.addPath(p);c.setStrokeColor(color(st));c.setLineWidth(n["width"] as? Double ?? 4);c.setLineCap(.round);c.setLineJoin(.round);c.strokePath()}}
 }
 if let labels=j["labels"] as? [[String:Any]] {NSGraphicsContext.saveGraphicsState();NSGraphicsContext.current=NSGraphicsContext(cgContext:c,flipped:true);for l in labels {let p=l["at"] as! [Double];(l["text"] as! NSString).draw(at:NSPoint(x:p[0],y:p[1]),withAttributes:[.font:NSFont.systemFont(ofSize:l["size"] as? Double ?? 15),.foregroundColor:NSColor(calibratedRed:0.23,green:0.19,blue:0.15,alpha:1)])};NSGraphicsContext.restoreGraphicsState()}
 var im=c.makeImage()!;if scale != 1 {let small=context(s[0],s[1]);small.interpolationQuality = .high;small.draw(im,in:CGRect(x:0,y:0,width:s[0],height:s[1]));im=small.makeImage()!}
 save(im,j["file"] as! String);if let dump=j["dump"] as? String {dumped(im,dump)}
}
