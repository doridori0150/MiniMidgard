// Independent macOS ImageIO decoder: verify every GIF frame, delay and pixel.
import Foundation
import ImageIO
import CoreGraphics

let root = URL(fileURLWithPath: CommandLine.arguments[1])
let manifest = try JSONSerialization.jsonObject(with: Data(contentsOf: root.appendingPathComponent("manifest.json"))) as! [String:Any]
let animations = manifest["animations"] as! [String:[String:Any]]
func rgba(_ im: CGImage, _ w: Int, _ h: Int, background: Bool) -> [UInt8] {
    var bytes=[UInt8](repeating:0,count:w*h*4)
    bytes.withUnsafeMutableBytes { buffer in
        let c=CGContext(data:buffer.baseAddress,width:w,height:h,bitsPerComponent:8,bytesPerRow:w*4,space:CGColorSpace(name:CGColorSpace.sRGB)!,bitmapInfo:CGImageAlphaInfo.premultipliedLast.rawValue)!
        if background {c.setFillColor(red:38.0/255,green:50.0/255,blue:62.0/255,alpha:1);c.fill(CGRect(x:0,y:0,width:w,height:h))}
        c.interpolationQuality = .none
        c.draw(im,in:CGRect(x:0,y:0,width:w,height:h))
    }
    return bytes
}
var results=[[String:Any]]()
for anim in ["attack","idle","walk"] {
    let a=animations[anim]!, names=a["frames"] as! [String], delays=a["durations"] as! [Int]
    for scale in [1,4] {
        let name="\(anim)_\(scale)x.gif", path=root.appendingPathComponent(name)
        let source=CGImageSourceCreateWithURL(path as CFURL,nil)!
        precondition(CGImageSourceGetCount(source)==names.count,"GIF frame count")
        var durations=[Int]()
        for i in names.indices {
            let image=CGImageSourceCreateImageAtIndex(source,i,nil)!
            precondition(image.width==128*scale && image.height==120*scale,"GIF size")
            let props=CGImageSourceCopyPropertiesAtIndex(source,i,nil)! as NSDictionary
            let gif=props[kCGImagePropertyGIFDictionary] as! NSDictionary
            let seconds=(gif[kCGImagePropertyGIFUnclampedDelayTime] ?? gif[kCGImagePropertyGIFDelayTime]) as! Double
            let ms=Int((seconds*1000).rounded());durations.append(ms)
            precondition(ms==delays[i],"GIF timing")
            let refSource=CGImageSourceCreateWithURL(root.appendingPathComponent("composite/\(names[i]).png") as CFURL,nil)!
            let ref=CGImageSourceCreateImageAtIndex(refSource,0,nil)!
            let actual=rgba(image,image.width,image.height,background:false),expected=rgba(ref,image.width,image.height,background:true)
            if actual != expected {
                let bad=actual.indices.filter{actual[$0] != expected[$0]}
                print("Mismatch \(name) / \(i): \(bad.count) bytes; first \(bad.prefix(12).map{[$0,Int(actual[$0]),Int(expected[$0])]})")
                exit(1)
            }
        }
        results.append(["file":name,"frames":names.count,"durationsMs":durations,"size":[128*scale,120*scale],"everyDecodedPixelMatchesPNG":true])
    }
}
let report:[String:Any] = ["passed":true,"decoder":"macOS ImageIO","files":results]
try JSONSerialization.data(withJSONObject:report,options:[.prettyPrinted,.sortedKeys]).write(to:root.appendingPathComponent("verification/gif_validation.json"))
print("PASS: ImageIO decoded all 36 GIF frames; timing, dimensions and every pixel match PNG composites.")
