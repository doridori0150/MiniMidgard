import AppKit
import Foundation

// Pixel-accurate board layout only. All paintings come from image_gen.
let root = URL(fileURLWithPath: CommandLine.arguments[1])
let W = 930, H = 960
func load(_ path: String) -> NSImage {
    guard let image = NSImage(contentsOf: root.appendingPathComponent(path)) else { fatalError(path) }
    return image
}
func bitmap(_ image: NSImage) -> NSBitmapImageRep {
    return NSBitmapImageRep(data: image.tiffRepresentation!)!
}
func save(_ rep: NSBitmapImageRep, _ path: String) {
    try! rep.representation(using: .png, properties: [:])!.write(to: root.appendingPathComponent(path))
}
func canvas(_ w: Int, _ h: Int, _ draw: () -> Void) -> NSBitmapImageRep {
    let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: w, pixelsHigh: h, bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: w * 4, bitsPerPixel: 32)!
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
    NSGraphicsContext.current!.imageInterpolation = .high
    draw()
    NSGraphicsContext.restoreGraphicsState()
    return rep
}
func text(_ s: String, _ x: CGFloat, _ top: CGFloat, _ size: CGFloat = 15, _ color: NSColor = NSColor(calibratedRed: 0.18, green: 0.23, blue: 0.23, alpha: 1)) {
    (s as NSString).draw(at: NSPoint(x: x, y: CGFloat(H)-top-size-4), withAttributes: [.font: NSFont.systemFont(ofSize: size, weight: .medium), .foregroundColor: color])
}
func rect(_ x: CGFloat, _ top: CGFloat, _ w: CGFloat, _ h: CGFloat, _ color: NSColor) {
    color.setFill(); NSRect(x: x, y: CGFloat(H)-top-h, width: w, height: h).fill()
}
func drawImage(_ im: NSImage, _ x: CGFloat, _ top: CGFloat, _ w: CGFloat, _ h: CGFloat) {
    im.draw(in: NSRect(x: x, y: CGFloat(H)-top-h, width: w, height: h), from: .zero, operation: .sourceOver, fraction: 1)
}
var metrics: [[String: Any]] = []
for d in ["a", "b"] {
    let forest = load("sources/r4\(d)_forest.png")
    let sprite = bitmap(load("sources/r4\(d)_hero_cutout.png"))
    var x0 = sprite.pixelsWide, y0 = sprite.pixelsHigh, x1 = 0, y1 = 0
    var transparent = 0
    for y in 0..<sprite.pixelsHigh { for x in 0..<sprite.pixelsWide {
        let a = sprite.colorAt(x: x, y: y)!.alphaComponent
        if a < 0.01 { transparent += 1 }
        if a > 0.5 { x0 = min(x0,x); x1 = max(x1,x); y0 = min(y0,y); y1 = max(y1,y) }
    } }
    guard transparent > 1000 else { fatalError("No real transparency") }
    let crop = sprite.cgImage!.cropping(to: CGRect(x:x0,y:y0,width:x1-x0+1,height:y1-y0+1))!
    let hero = NSImage(cgImage: crop, size: NSSize(width:crop.width,height:crop.height))
    let ratio = CGFloat(crop.width)/CGFloat(crop.height)
    let fieldHeight: CGFloat = d == "a" ? 144 : 168
    let board = canvas(W,H) {
        NSColor(calibratedRed:0.94,green:0.93,blue:0.89,alpha:1).setFill(); NSRect(x:0,y:0,width:W,height:H).fill()
        text("R4-\(d.uppercased())  /  \(d == "a" ? "동화풍" : "부드러운 사실풍")",32,18,25)
        text("390 × 844  ·  휴대폰 필드",32,54,13)
        drawImage(forest,32,80,390,844)
        let heroWidth = fieldHeight * ratio
        drawImage(hero,32+211-heroWidth/2,80+523-fieldHeight,heroWidth,fieldHeight)
        rect(460,80,438,844,NSColor(calibratedRed:0.985,green:0.98,blue:0.96,alpha:1))
        text("실제 픽셀 크기 비교",484,101,22)
        text("이미지를 100% 배율로 확인하세요.",484,137,14)
        let baseline: CGFloat = 390
        for (center,h) in [(CGFloat(563),CGFloat(120)),(CGFloat(769),CGFloat(200))] {
            drawImage(hero,center-h*ratio/2,baseline-h,h*ratio,h)
            text("\(Int(h)) px",center-29,407,15)
            rect(center-h*ratio/2,baseline+5,h*ratio,1,NSColor(calibratedWhite:0.7,alpha:1))
        }
        text("필드 주인공  \(Int(fieldHeight)) px",484,470,19)
        text("쿠키 + 보조 파티원 2명 + 슬라임 1마리",484,508,14)
        text("판독성 검토",484,568,19)
        let lines = d == "a" ? ["120px: 머리·갑옷·붉은 띠가 구분됨", "144px: 3인 파티 필드의 권장 시작 크기", "200px: 표정과 문양 비교에 적합", "권장 하한: 140px 전후"] : ["120px: 얼굴과 얇은 장식이 뭉개짐", "168px: 전투 실루엣을 위한 시작 크기", "200px: 얼굴·의상 감상에 더 적합", "권장 하한: 168px 전후"]
        for (i,line) in lines.enumerated() { text(line,484,607+CGFloat(i*35),14) }
        text("높이 = 잔머리 끝부터 부츠 밑창까지",484,795,13)
        text("배경과 인물은 이미지 생성으로 제작",484,823,13)
        text("픽셀 크기·배치만 정밀 합성",484,850,13)
        text("컨셉 시안  ·  런타임 적용 전",484,889,12)
    }
    save(board,"r4\(d)_field.png")
    let viewport = board.cgImage!.cropping(to: CGRect(x:32,y:80,width:390,height:844))!
    save(NSBitmapImageRep(cgImage:viewport),"sources/r4\(d)_phone_390x844.png")
    metrics.append(["direction":d,"board_size":[W,H],"phone_rect":[32,80,390,844],"hero_alpha_bbox":[x0,y0,x1-x0+1,y1-y0+1],"field_hero_height":Int(fieldHeight),"inset_heights":[120,200],"transparent_pixels":transparent])
}
let json = try! JSONSerialization.data(withJSONObject: metrics, options: [.prettyPrinted,.sortedKeys])
try! json.write(to:root.appendingPathComponent("sources/layout_metrics.json"))
print(String(data:json,encoding:.utf8)!)
