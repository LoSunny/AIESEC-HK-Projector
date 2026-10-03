const specialKeys: Record<string, string> = {
    " ": "Space", ArrowLeft: "Left", ArrowRight: "Right", ArrowUp: "Up", ArrowDown: "Down",
    PageUp: "PageUp", PageDown: "PageDown", Home: "Home", End: "End", Insert: "Insert",
    Delete: "Delete", Backspace: "Backspace", Enter: "Return", Tab: "Tab", "+": "Plus"
};

export function shortcutFromEvent(event: KeyboardEvent): string | null {
    if (["Control", "Alt", "Shift", "Meta"].includes(event.key)) return null;
    const key = specialKeys[event.key] || (/^[a-z0-9]$/i.test(event.key) ? event.key.toUpperCase() :
        /^F(?:[1-9]|1\d|2[0-4])$/.test(event.key) ? event.key : [",", ".", "/", ";", "[", "]", "\\", "'", "`", "=", "-"].includes(event.key) ? event.key : null);
    if (!key) throw new Error("This button was not recognized. Try the next or previous slide button on your clicker.");
    return [event.ctrlKey && "Control", event.altKey && "Alt", event.shiftKey && "Shift", event.metaKey && "Super", key].filter(Boolean).join("+");
}

export function shortcutLabels(shortcut: string): string[] {
    const labels: Record<string, string> = {
        Control: "Ctrl",
        Super: "⌘ / Win",
        Left: "←",
        Right: "→",
        Up: "↑",
        Down: "↓",
        Return: "Enter",
        Plus: "+"
    };
    return shortcut.split("+").map(key => labels[key] || key);
}
