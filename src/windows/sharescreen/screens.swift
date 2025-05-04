import Cocoa

let windowListInfo = CGWindowListCopyWindowInfo(.optionAll, kCGNullWindowID) as! [[String: Any]]

for windowInfo in windowListInfo {
    if let name = windowInfo[kCGWindowName as String] as? String,
       let pid = windowInfo[kCGWindowOwnerPID as String] as? Int {
        print("Window Name: (\(name)), PID: (\(pid))")
    }
}
