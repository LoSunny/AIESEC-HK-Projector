import Foundation
import Quartz

// Ensure the correct number of arguments
guard CommandLine.argc == 3 else {
    print("Usage: \(CommandLine.arguments[0]) <pid> <key>")
    exit(1)
}

// Parse arguments
let pidString = CommandLine.arguments[1]
let keyString = CommandLine.arguments[2]

// Print pidString and keyString
print("pidString: \(pidString)")
print("keyString: \(keyString)")

guard let pid = Int(pidString), let key = UInt16(keyString, radix: 10) else {
    print("Invalid PID or key.")
    exit(1)
}

print("pid: \(pid)")
print("key: \(key)")

let src = CGEventSource(stateID: CGEventSourceStateID.hidSystemState)

let keyDownEvent = CGEvent(keyboardEventSource: src, virtualKey: key, keyDown: true) // key down event
let keyUpEvent = CGEvent(keyboardEventSource: src, virtualKey: key, keyDown: false) // key up event

print("Sending to pid: \(pid)")
keyDownEvent?.postToPid(pid_t(pid)) // convert int to pid_t
keyUpEvent?.postToPid(pid_t(pid))
