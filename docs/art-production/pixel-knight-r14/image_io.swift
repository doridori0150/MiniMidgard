import Foundation
import AppKit
let args = CommandLine.arguments
let url = URL(fileURLWithPath: args[1])
let bitmap = NSBitmapImageRep(data: try Data(contentsOf: url))!
let w = bitmap.pixelsWide, h = bitmap.pixelsHigh
var out = Data()
for y in 0..<h { for x in 0..<w {
 let c = bitmap.colorAt(x: x,y:y)!.usingColorSpace(.deviceRGB)!
 out.append(contentsOf:[UInt8(max(0,min(255,Int((c.redComponent*255).rounded())))),UInt8(max(0,min(255,Int((c.greenComponent*255).rounded())))),UInt8(max(0,min(255,Int((c.blueComponent*255).rounded())))),UInt8(max(0,min(255,Int((c.alphaComponent*255).rounded()))))])
}}
try out.write(to:URL(fileURLWithPath:args[2]))
print("\(w) \(h)")
