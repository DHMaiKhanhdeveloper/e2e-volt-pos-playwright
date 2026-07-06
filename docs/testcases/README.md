# docs/testcases/ — Đầu ra của skill `linear-testcase-gen` (Skill 2/4)

Mỗi màn hình → một file `.md` liệt kê **tất cả test case**, sau đó skill sinh **code test**
(page object + spec) dựa trên chính file `.md` này.

- Tạo bằng: `/linear-testcase-gen <tên màn hình>`
- Định dạng file: `<kebab-tên-màn-hình>-testcases.md`
- Code sinh ra nằm ở `src/pages/...` và `tests/regression/...` (theo convention repo).
