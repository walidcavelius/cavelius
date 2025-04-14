---
title: "rust shell"
date: 2024-12-29
draft: false
---

a basic shell in rust i did with codecrafters as it was in free access during the month of dec. 2024.

the project aims to implement a very basic [POSIX](https://pubs.opengroup.org/onlinepubs/9699919799/utilities/V3_chap02.html) compliant shell capable of:
- executing various basic built in commands: `echo`, `exit`, `type`, `pwd`, `cd`
- running external programs using the `PATH` environment variable
- handling quotes following the [Bash Reference Manual](https://www.gnu.org/software/bash/manual/bash.html#Quoting)

[github link](https://github.com/walidcavelius/basic_rust_shell)
