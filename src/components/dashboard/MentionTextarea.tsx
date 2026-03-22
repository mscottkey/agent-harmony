import { useState, useRef, useCallback, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";

interface TeamMember {
  name: string;
  avatar: string;
}

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  teamMembers: TeamMember[];
  placeholder?: string;
  className?: string;
}

export default function MentionTextarea({
  value,
  onChange,
  onKeyDown,
  teamMembers,
  placeholder,
  className,
}: MentionTextareaProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionFilter, setSuggestionFilter] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPos, setCursorPos] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const filtered = teamMembers.filter((m) =>
    m.name.toLowerCase().includes(suggestionFilter.toLowerCase())
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      const pos = e.target.selectionStart || 0;
      onChange(val);
      setCursorPos(pos);

      // Check if we're typing an @mention
      const textBeforeCursor = val.slice(0, pos);
      const atMatch = textBeforeCursor.match(/@(\w*)$/);
      if (atMatch) {
        setSuggestionFilter(atMatch[1]);
        setShowSuggestions(true);
        setSelectedIndex(0);
      } else {
        setShowSuggestions(false);
      }
    },
    [onChange]
  );

  const insertMention = useCallback(
    (member: TeamMember) => {
      const textBeforeCursor = value.slice(0, cursorPos);
      const atMatch = textBeforeCursor.match(/@(\w*)$/);
      if (!atMatch) return;

      const beforeAt = textBeforeCursor.slice(0, atMatch.index);
      const afterCursor = value.slice(cursorPos);
      const mention = `@${member.name}`;
      const newValue = `${beforeAt}${mention} ${afterCursor}`;
      onChange(newValue);
      setShowSuggestions(false);

      // Restore focus
      setTimeout(() => {
        const newPos = (atMatch.index || 0) + mention.length + 1;
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(newPos, newPos);
      }, 0);
    },
    [value, cursorPos, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (showSuggestions && filtered.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((i) => (i + 1) % filtered.length);
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
          return;
        }
        if (e.key === "Enter" && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          insertMention(filtered[selectedIndex]);
          return;
        }
        if (e.key === "Escape") {
          setShowSuggestions(false);
          return;
        }
      }
      onKeyDown?.(e);
    },
    [showSuggestions, filtered, selectedIndex, insertMention, onKeyDown]
  );

  // Close on blur
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!(e.target as Element)?.closest("[data-mention-dropdown]")) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
      />
      {showSuggestions && filtered.length > 0 && (
        <div
          data-mention-dropdown
          className="absolute left-0 bottom-full mb-1 w-52 rounded-md border border-border bg-popover shadow-lg z-50 py-1 animate-fade-in"
        >
          <div className="px-2 py-1 text-[9px] font-mono text-muted-foreground uppercase tracking-wider">
            Mention a team member
          </div>
          {filtered.map((member, i) => (
            <button
              key={member.name}
              className={`w-full flex items-center gap-2 px-2 py-1.5 text-left text-[11px] transition-colors ${
                i === selectedIndex
                  ? "bg-primary/10 text-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                insertMention(member);
              }}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary shrink-0">
                {member.avatar}
              </div>
              <span>{member.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Render annotation text with highlighted @mentions */
export function renderWithMentions(text: string) {
  const parts = text.split(/(@\w[\w\s]*?\b(?=\s|$|[.,!?]))/g);
  return parts.map((part, i) => {
    if (part.startsWith("@")) {
      return (
        <span
          key={i}
          className="inline-flex items-center gap-0.5 px-1 py-0 rounded bg-primary/15 text-primary text-[10px] font-semibold cursor-default"
        >
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
