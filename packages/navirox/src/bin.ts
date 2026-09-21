#!/usr/bin/env node
import { runCli } from '@memolabs-apps/cli'

const exitCode = await runCli(process.argv.slice(2), {
  out: (line) => {
    process.stdout.write(`${line}\n`)
  },
  err: (line) => {
    process.stderr.write(`${line}\n`)
  },
})

process.exitCode = exitCode
