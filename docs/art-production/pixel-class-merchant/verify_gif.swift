import Foundation
import ImageIO
let root=URL(fileURLWithPath:CommandLine.arguments[1])
let files=try FileManager.default.contentsOfDirectory(at:root,includingPropertiesForKeys:nil).filter{$0.pathExtension=="gif"}.sorted{$0.path<$1.path}
var result:[[String:Any]]=[]
for file in files {
 guard let s=CGImageSourceCreateWithURL(file as CFURL,nil) else {fatalError("GIF load: \(file)")}
 let count=CGImageSourceGetCount(s)
 var times:[Double]=[];var sizes:[[Int]]=[]
 for i in 0..<count {
  guard let im=CGImageSourceCreateImageAtIndex(s,i,nil) else {fatalError("GIF frame: \(file) \(i)")}
  let props=CGImageSourceCopyPropertiesAtIndex(s,i,nil)! as NSDictionary
  let gp=props[kCGImagePropertyGIFDictionary] as! NSDictionary
  times.append((gp[kCGImagePropertyGIFUnclampedDelayTime] as? Double ?? gp[kCGImagePropertyGIFDelayTime] as? Double ?? -1)*1000)
  sizes.append([im.width,im.height])
 }
 result.append(["file":file.lastPathComponent,"frames":count,"durations":times,"sizes":sizes])
}
let data=try JSONSerialization.data(withJSONObject:result,options:[.prettyPrinted,.sortedKeys])
try data.write(to:root.appendingPathComponent("verification/gif_decode.json"))
print("Decoded \(result.count) GIF files with Apple ImageIO")
