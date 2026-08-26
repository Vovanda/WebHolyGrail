"""
Тонкая обёртка над access-invariants.smt2 — читает маркеры ;@TEST / ;@EXPECT,
гоняет каждый запрос в свежем z3.Solver и сверяет с ожидаемым sat/unsat,
объявленным в самой спеке.

Запуск:
    pip install z3-solver
    python spec/video/verify_access.py

Скрипт намеренно ничего не знает о предметной области. Всё живёт в .smt2:
сигнатуры (секция A), инварианты (B), операции (C) и запросы (D, по одному на
блок ;@TEST). Добавить проверку — добавить блок ;@TEST / ;@EXPECT / (push) …
(check-sat) (pop), питон править не нужно.
"""

from __future__ import annotations

import os
import re
import sys

import z3

SPEC_PATH = os.path.join(os.path.dirname(__file__), "access-invariants.smt2")
with open(SPEC_PATH, "r", encoding="utf-8") as f:
    SPEC = f.read()


# Убираем собственные push/pop/check-sat/get-model файла: каждый запрос здесь
# исполняется в отдельном солвере, а эти строки нужны, чтобы спека оставалась
# запускаемой через z3 из командной строки. Просочившись сюда, они сдвинут
# результат.
_STRIP_DIRECTIVE = re.compile(
    r"^\s*\((push|pop|check-sat|get-model)\b[^\n]*\)\s*$",
    re.MULTILINE,
)


def _clean(text: str) -> str:
    return _STRIP_DIRECTIVE.sub("", text)


# Всё до первого ;@TEST — общая часть: сигнатуры, инварианты, операции.
# Каждый блок ;@TEST разбирается на имя, ожидаемый исход и свои утверждения.
_TEST_BLOCK = re.compile(
    r"^;@TEST\s+(?P<name>.+?)\s*\n"
    r"^;@EXPECT\s+(?P<expected>sat|unsat)\s*\n"
    r"(?P<body>.*?)"
    r"(?=^;@TEST\s+|\Z)",
    re.DOTALL | re.MULTILINE,
)

split_at = SPEC.find(";@TEST")
if split_at == -1:
    print("В спеке нет блоков ;@TEST — проверять нечего.")
    sys.exit(2)

baseline = _clean(SPEC[:split_at])

passed = failed = 0
for match in _TEST_BLOCK.finditer(SPEC, split_at):
    name = match.group("name").strip()
    expected = match.group("expected")
    body = _clean(match.group("body"))

    solver = z3.Solver()
    try:
        solver.from_string(baseline + body)
    except z3.Z3Exception as exc:
        print(f"[РАЗБОР] {name}: {exc}")
        failed += 1
        continue

    actual = str(solver.check())
    ok = actual == expected
    print(f"[{'ОК' if ok else 'СБОЙ'}] {name}  (ждали {expected}, вышло {actual})")
    if ok:
        passed += 1
    else:
        failed += 1
        # Контрпример показываем только когда свойство должно было не
        # выполняться, а выполнилось: именно он объясняет, что сломалось.
        if actual == "sat":
            model = solver.model()
            print("        контрпример (фрагмент):")
            for decl in list(model.decls())[:8]:
                print(f"          {decl.name()} = {model[decl]}")

print()
print(f"Итог: {passed} прошло, {failed} не прошло (всего {passed + failed})")
sys.exit(0 if failed == 0 else 1)
