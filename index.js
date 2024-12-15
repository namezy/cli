#! /usr/bin/env node
import download from "download-git-repo"
// import simpleGit from 'simple-git';
import ora from "ora"
// const git = simpleGit();
import figlet from "figlet"
import chalk from "chalk"
import path, { dirname } from "path"
import { fileURLToPath } from "url"
import { Command } from "commander"
import fs from "fs-extra"
import { createRequire } from "module"
const require = createRequire(import.meta.url)
const pkg = require("./package.json")
import shelljs from "shelljs"
import {
  error,
  info,
  isDirectory,
  deleteDir,
  cloneTemplate,
  updatePackageJson,
  npmInstall,
} from "./util.js"
import { table } from "table"
import inquirer from "inquirer"
// const pkg = await fs.readFile(path.resolve(dirname(fileURLToPath(import.meta.url)),'./package.json'), 'utf-8')
const templates = [
  {
    name: "webpack-template",
    url: "github:yingside/webpack-template",
    desc: "webpack5+vue3",
  },
  {
    name: "vue-cli-template",
    url: "github:yingside/vue-cli-template",
    desc: "vue-cli3+vue3",
  },
  {
    name: "vite-template",
    url: "github:yingside/vite-template",
    desc: "vite+vue3",
  },
  {
    name: "vue-admin",
    url: "github:cmdparkkour/vue-admin-box",
    desc: "vite+vue3中后台管理系统",
  }
]
const program = new Command()
// console.log(figlet)
program
  .name("mycli")
  //   .usage("<command>")
  .description("mycli是一个简单的脚手架工具")
program.version(pkg.version, "-v, --version", "查看版本号")


// program.option('-n, --name <type>','set name' ,dirname(fileURLToPath(import.meta.url)))
// program.option("-p, --port <port>", "set port")
// program.option("-f, --force", "set framework")
// program.option("-d, --delete", "is delete", true)

program
  .command("create <name>")
  .description("创建项目")
  .option("-t, --template <template>", "选择模板")
  .option("-f, --force", "是否覆盖本地文件")
  .option("-q, --quick", "快速创建项目，忽略项目描述信息")
  .action(createAction)

program
  .command("list")
  .description("查看所有模板")
  .action(() => {
    const config = {
      //   columnDefault: {
      //     width: 10,
      //   },
      header: {
        alignment: "center",
        content: "所有模板",
      },
    }

    const data = templates.map((item) => {
      return [item.name, item.url, item.desc]
    })
    console.log(table(data, config))
  })

// console.log(process.argv)
// console.log(
//   "\r\n" +
//     figlet.textSync("Hello World!", {
//       font: "Standard",
//       horizontalLayout: "default",
//       verticalLayout: "default",
//     })
// )
// const spinner = ora({
//   text: chalk.yellow("拉取中..."),
//   color: "yellow",
// }).start()

// download("github:iamkun/dayjs", "./test", function (err) {
//   if (err) {
//     console.log(chalk.red(err))
//     spinner.fail("拉取失败")
//   } else {
//     spinner.succeed(chalk.bgBlue.white.bold("拉取成功"))
//   }
// })
program.parse(process.argv)
// const options = program.opts()
// console.log(options)

async function createAction(name, options) {
  let repository = ""
  //检查模版是否存在
  if (options.template) {
    const template = templates.find((item) => item.name === options.template)
    if (!template) {
      console.log(error + chalk.red("模版不存在"))
      console.log(info + chalk.blue("查看所有模版 self-vue list"))
      return
    }
    repository = template.url
  }

  if (!shelljs.which("git")) {
    console.log(error + chalk.red("git not found"))
    shelljs.exit(1)
  }
  //判断文件名name包含中文以及特殊字符，
  if (/[\u4e00-\u9fa5]/.test(name)) {
    console.log(error + chalk.red("文件名不能包含中文"))
    return
  }
  //检查当前目录下是否有重名文件
  const targetDir = path.resolve(process.cwd(), name)
  const isDir = await isDirectory(targetDir)
  if (isDir) {
    if (options.force) {
      //删除文件
      const isDelete = await deleteDir(targetDir)
      if (!isDelete) {
        console.log(error + chalk.red("文件删除失败"))
        return
      }
    } else {
      //提示文件已存在
      try {
        const data = await inquirer.prompt([
          {
            type: "confirm",
            name: "isDelete",
            message: "文件夹已存在，是否删除",
          },
        ])
        if (data.isDelete) {
          const isDelete = await deleteDir(targetDir)
          if (!isDelete) {
            console.log(error + chalk.red("文件删除失败"))
            return
          }
        } else {
          return
        }
      } catch (error) {
        console.log(chalk.red("创建失败"))
        return
      }
    }
  }

  if (!repository) {
    try {
      const { url } = await inquirer.prompt([
        {
          type: "list",
          name: "url",
          message: "请选择模版",
          choices: templates.map((item) => item.name),
        },
      ])
      repository = url
    } catch (error) {
      console.log(chalk.red("创建失败"))
    }
  }
  const gitPath = templates.find((item) => item.name === repository).url
  await cloneTemplate(gitPath, targetDir)
  const projectExtras = [
    {
      name: "name",
      message: "请输入项目名称",
      // validate(value) {
      //   if (!value) {
      //     return "项目名称不能为空"
      //   }
      //   return true
      // }
    },
    {
      name: "description",
      message: "请输入项目描述",
    },
    {
      name: "author",
      message: "请输入作者",
    },
    {
      name: "keywords",
      message: "请输入关键字（,分割）",
    },
  ]
  inquirer
    .prompt(projectExtras.map((item) => ({ ...item, type: "input" })))
    .then((answers) => {
      if (!answers.name || answers.name === "" || answers.name.trim() === "") {
        answers.name = name
      }
      if (
        !answers.keywords ||
        answers.keywords === "" ||
        answers.keywords.trim() === ""
      ) {
        answers.keywords = ""
      }
      const path1 = path.resolve(process.cwd(), name, "package.json")
      updatePackageJson(path1, answers)
      npmInstall(name)
    })
}
