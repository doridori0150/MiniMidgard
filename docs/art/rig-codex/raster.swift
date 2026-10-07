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
 if type=="extract" {
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
    let tc=context(im.width,im.height); tc.draw(im,in:CGRect(x:0,y:0,width:im.width,height:im.height)); tc.setBlendMode(.multiply); tc.setFillColor(CGColor(red:color[0],green:color[1],blue:color[2],alpha:1)); tc.fill(CGRect(x:0,y:0,width:im.width,height:im.height)); tc.setBlendMode(.destinationIn); tc.draw(im,in:CGRect(x:0,y:0,width:im.width,height:im.height)); draw(c,tc.makeImage()!,0,0,Double(im.width),Double(im.height))
   } else { draw(c,im,0,0,Double(im.width),Double(im.height)) }
   c.restoreGState()
  }
  if let labels=j["labels"] as? [[String:Any]] { NSGraphicsContext.saveGraphicsState(); NSGraphicsContext.current=NSGraphicsContext(cgContext:c,flipped:true); for l in labels { let p=l["at"] as! [Double]; (l["text"] as! NSString).draw(at:NSPoint(x:p[0],y:p[1]),withAttributes:[.font:NSFont.systemFont(ofSize:l["size"] as? Double ?? 15),.foregroundColor:NSColor(calibratedRed:0.23,green:0.19,blue:0.15,alpha:1)]) }; NSGraphicsContext.restoreGraphicsState() }
  save(c.makeImage()!,j["file"] as! String)
 }
}
let data=try! JSONSerialization.data(withJSONObject:report,options:[.prettyPrinted,.sortedKeys]); if report.count > 1 { try! data.write(to:root.appendingPathComponent("verification/raster_report.json")) }
