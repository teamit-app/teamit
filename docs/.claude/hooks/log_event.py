#!/usr/bin/env python3
"""
Claude Code 세션의 프롬프트 / 도구 호출 / 도구 결과를 JSONL로 기록하는 훅.
settings.json 의 UserPromptSubmit / PreToolUse / PostToolUse 에서 공통으로 호출된다.
어떤 경우에도 non-zero exit 을 하지 않는다 (로깅 실패가 작업을 막으면 안 됨).

배치 위치: <프로젝트 루트>/.claude/hooks/log_event.py
"""
import sys
import json
import datetime
import os

# 로그 파일 위치: 프로젝트 루트 기준 logs/claude-audit.jsonl
LOG_DIR = os.path.join(os.getcwd(), "logs")
LOG_PATH = os.path.join(LOG_DIR, "claude-audit.jsonl")

# 도구 응답이 너무 길면 로그가 비대해지므로 잘라낸다
MAX_FIELD_CHARS = 4000


def truncate(value):
    if isinstance(value, str) and len(value) > MAX_FIELD_CHARS:
        return value[:MAX_FIELD_CHARS] + f"... [truncated, {len(value)} chars total]"
    return value


def main():
    try:
        raw = sys.stdin.read()
        data = json.loads(raw) if raw else {}
    except Exception as e:
        # 파싱 실패해도 세션을 막지 않는다
        data = {"_parse_error": str(e)}

    event = {
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "event": data.get("hook_event_name"),
        "session_id": data.get("session_id"),
        "cwd": data.get("cwd"),
        "transcript_path": data.get("transcript_path"),
    }

    hook_event = data.get("hook_event_name")

    if hook_event == "UserPromptSubmit":
        event["prompt"] = truncate(data.get("prompt"))

    elif hook_event == "PreToolUse":
        event["tool_name"] = data.get("tool_name")
        event["tool_input"] = truncate(json.dumps(data.get("tool_input"), ensure_ascii=False))

    elif hook_event == "PostToolUse":
        event["tool_name"] = data.get("tool_name")
        event["tool_input"] = truncate(json.dumps(data.get("tool_input"), ensure_ascii=False))
        event["tool_response"] = truncate(json.dumps(data.get("tool_response"), ensure_ascii=False))

    try:
        os.makedirs(LOG_DIR, exist_ok=True)
        with open(LOG_PATH, "a", encoding="utf-8") as f:
            f.write(json.dumps(event, ensure_ascii=False) + "\n")
    except Exception:
        # 로그 기록 실패해도 절대 작업을 막지 않는다
        pass

    # exit code 0 = 항상 통과 (차단 훅 아님, 순수 로깅용)
    sys.exit(0)


if __name__ == "__main__":
    main()