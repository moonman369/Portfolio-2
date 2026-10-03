import { SquarePen } from "lucide-react";
import { headerActionClass } from "../lib/moonmindUi";
import { useMoonmind } from "../context/MoonmindContext";
import { MOONMIND_NEW_CHAT_LABEL } from "../context/constants";

// "New chat" in both chat headers (it starts a new conversation; it used to
// say "Refresh chat" with a reload arrow). With nothing to lose (only the
// greeting) it is dimmed and does nothing, but stays focusable
// (aria-disabled) so it can still be found. While the confirmation is open
// it is disabled outright.
const MoonmindNewChat = () => {
  const { messages, refreshChat, refreshPending } = useMoonmind();
  const empty = !messages.some((m) => m.role === "user");

  return (
    <button
      type="button"
      onClick={empty ? undefined : refreshChat}
      disabled={refreshPending}
      aria-disabled={empty || undefined}
      aria-label={MOONMIND_NEW_CHAT_LABEL}
      title={MOONMIND_NEW_CHAT_LABEL}
      className={headerActionClass}
    >
      <SquarePen size={17} aria-hidden="true" />
    </button>
  );
};

export default MoonmindNewChat;
