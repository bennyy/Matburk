#!/usr/bin/env python3
"""Encode a JSON file (or stdin) to a single-line base64 string.

Usage:
  python tool/json_to_base64.py path/to/file.json
  cat file.json | python tool/json_to_base64.py
"""
import argparse
import base64
import sys
from pathlib import Path


def encode_bytes(data: bytes) -> str:
    """Return base64 encoding without newlines."""
    return base64.b64encode(data).decode("utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Encode JSON content to base64 for env vars",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "json_file",
        nargs="?",
        type=Path,
        help="Path to JSON file (omit to read from stdin)",
    )
    args = parser.parse_args()

    try:
        if args.json_file:
            data = args.json_file.read_bytes()
        else:
            data = sys.stdin.buffer.read()
            if not data:
                raise ValueError("No input provided; supply a file or pipe data")
    except Exception as exc:  # pragma: no cover - CLI error handling
        parser.error(str(exc))

    encoded = encode_bytes(data)
    print(encoded)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
