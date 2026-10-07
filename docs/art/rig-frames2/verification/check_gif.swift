import AppKit
import ImageIO
import Foundation
let root=URL(fileURLWithPath:CommandLine.arguments[1])
let src=CGImageSourceCreateWithURL(root.appendingPathComponent("preview_animation.gif") as CFURL,nil)!
let count=CGImageSourceGetCount(src);var delays:[Double]=[];var signatures=Array(repeating:Set<UInt64>(),count:12);var sizes=Set<String>()
for i in 0..<count {
 let props=CGImageSourceCopyPropertiesAtIndex(src,i,nil)! as NSDictionary
 let gif=props[kCGImagePropertyGIFDictionary] as! NSDictionary
 delays.append((gif[kCGImagePropertyGIFUnclampedDelayTime] ?? gif[kCGImagePropertyGIFDelayTime]) as! Double)
 let im=CGImageSourceCreateImageAtIndex(src,i,nil)!;sizes.insert("\(im.width)x\(im.height)")
 for row in 0..<4 {for col in 0..<3 {
  let tile=im.cropping(to:CGRect(x:col*285,y:44+row*250,width:285,height:220))!
  let ctx=CGContext(data:nil,width:285,height:220,bitsPerComponent:8,bytesPerRow:285*4,space:CGColorSpaceCreateDeviceRGB(),bitmapInfo:CGImageAlphaInfo.premultipliedLast.rawValue)!
  ctx.draw(tile,in:CGRect(x:0,y:0,width:285,height:220));let p=ctx.data!.assumingMemoryBound(to:UInt8.self);var hash:UInt64=14695981039346656037
  for k in stride(from:0,to:285*220*4,by:4) {hash=(hash ^ UInt64(p[k])) &* 1099511628211;hash=(hash ^ UInt64(p[k+1])) &* 1099511628211;hash=(hash ^ UInt64(p[k+2])) &* 1099511628211}
  signatures[row*3+col].insert(hash)
 }}
}
let unique=signatures.map{$0.count};let ok=count==80 && sizes==["890x1050"] && delays.allSatisfy{abs($0-0.04)<0.00001} && unique.allSatisfy{$0>1}
let report:[String:Any]=["status":ok ? "pass":"fail","decodedFrames":count,"frameSizes":Array(sizes),"totalDurationMs":delays.reduce(0,+)*1000,"frameDurationMs":40,"distinctDecodedImagesPerRowIdleWalkAttack":stride(from:0,to:12,by:3).map {Array(unique[$0..<$0+3])},"rows":["novice female","novice male","swordsman female","swordsman male"]]
try! JSONSerialization.data(withJSONObject:report,options:[.prettyPrinted,.sortedKeys]).write(to:root.appendingPathComponent("verification/gif_report.json"))
if !ok {exit(1)}
