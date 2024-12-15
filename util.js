import chalk from "chalk"
import fs from "fs-extra"
import ora from "ora"
import download from "download-git-repo"
import shell from "shelljs"
export function isUnicodeSupported() {
  const { env } = process
  const { TERM, TERM_PROGRAM } = env

  if (process.platform !== "win32") {
    return TERM !== "linux" // Linux console (kernel)
  }

  return (
    Boolean(env.WT_SESSION) || // Windows Terminal
    Boolean(env.TERMINUS_SUBLIME) || // Terminus (<0.2.27)
    env.ConEmuTask === "{cmd::Cmder}" || // ConEmu and cmder
    TERM_PROGRAM === "Terminus-Sublime" ||
    TERM_PROGRAM === "vscode" ||
    TERM === "xterm-256color" ||
    TERM === "alacritty" ||
    TERM === "rxvt-unicode" ||
    TERM === "rxvt-unicode-256color" ||
    env.TERMINAL_EMULATOR === "JetBrains-JediTerm"
  )
}

const _isUnicodeSupported = isUnicodeSupported()
export const info = chalk.blue(_isUnicodeSupported ? "ℹ" : "i")
export const success = chalk.green(_isUnicodeSupported ? "✔" : "√")
export const warning = chalk.yellow(_isUnicodeSupported ? "⚠" : "‼")
export const error = chalk.red(_isUnicodeSupported ? "✖️" : "×")

export const isDirectory = async (path) => {
  try {
    const stat = await fs.stat(path)
    return stat.isDirectory()
  } catch {
    return false
  }
}

export const deleteDir = async (path) => {
  try {
    await fs.rm(path, { force: true, recursive: true })
    return true
  } catch {
    return false
  }
}

export const cloneTemplate = async (repository, outDir) => {
  console.log(repository)
  const spinner = ora({
    text: chalk.yellow("拉取中..."),
  }).start()
  return new Promise((resolve, reject) => {
    download(repository, outDir, function (err) {
      if (err) {
        console.log(err)
        // console.log(chalk.red(err))
        spinner.fail("拉取失败")
        reject(err)
      } else {
        resolve()
        spinner.succeed(chalk.bgBlue.white.bold("拉取成功"))
      }
    })
  })
}

export const updatePackageJson = async (path, options) => {
  const pkj = await fs.readJSON(path)
  pkj.name = options.name
  if (options.description) pkj.description = options.description
  if (options.author) pkj.author = options.author
  if (options.keywords) pkj.keywords = options.keywords.split(",")
  await fs.writeJSON(path, pkj, { spaces: 2 })
}

export const npmInstall = async (name) => {
  const spin = ora({
    text: chalk.yellow("安装依赖..."),
  }).start()
  return new Promise((resolve, reject) => {
    if (name) shell.cd(name)
    shell.exec("npm install --force -d", (code, stdout, stderr) => {
      if (code !== 0) {
        spin.fail("安装失败")
        reject(stderr)
      } else {
        spin.succeed(chalk.bgBlue.white.bold("安装成功"))
        resolve()
      }
    })
  })
}
