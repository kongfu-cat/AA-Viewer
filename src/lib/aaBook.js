/* eslint-disable */
const AABook = (function () {
  const fs = require('fs')
  const rp = require('request-promise')
  const iconv = require('iconv-lite')
  const cheerio = require('cheerio')
  const pathParser = require('path')
  const urlParser = require('url')

  class AALoader {
    load (url, options) {
      let isLocal = options.isLocal || false,
        encoding = options.encoding || 'utf8' // euc-jp
      url = url || ''
      return new Promise((resolve, reject) => {
        if (isLocal) {
          fs.readFile(url, (err, data) => {
            if (err) {
              console.error(err)
              reject(err)
            }
            data = iconv.decode(data, encoding)
            resolve(data)
          })
        } else {
          rp({ uri: url, encoding: null }).then(data => {
            data = iconv.decode(data, encoding)
            resolve(data)
          }).catch(err => {
            console.error(err)
            reject(err)
          })
        }
      })
    }
    save (path, data) {
      fs.writeFile(path, data, function (err) {
        if (err) {
          return console.error(err)
        }
      })
    }
  }

  class AANode {
    constructor(comment, content) {
      this.comment = comment
      this.content = content
    }
    toHtml () {
      let comment = this.comment.replace(/\n/g, '<br/>'),
        content = this.content.replace(/\n/g, '<br/>')
      return `<dt>${comment}</dt><dd>${content}</dd>`
    }
    toString () {
      return this.comment + '\n' + this.content
    }
  }
  class AAParser {
    parse (data) {
      data = data.replace(/\n/g, '')
      const $ = cheerio.load(data, { decodeEntities: false })
      let commentArr = [], contentArr = [], nodes = []
      $('dt').map(function (i, el) {
        commentArr[i] = $(el).html().replace(/<br\/?>/g, '\n')
      })
      $('dd').map(function (i, el) {
        contentArr[i] = $(el).html().replace(/<br\/?>/g, '\n')
      })
      for (let i = 0; i < commentArr.length; i++) {
        nodes.push(new AANode(commentArr[i], contentArr[i]))
      }
      // console.log(nodes[0])
      return nodes
    }
    // data: String|Array[AANode,...]
    parseToHtml (data) {
      let nodes = [],
        text = ''
      if (typeof data === 'string') {
        nodes = this.parse(data)
      } else if (data instanceof Array && data[0] instanceof AANode) {
        nodes = data
      } else {
        throw ('解析失败，输入参数有误')
      }
      for (let node of nodes) {
        text += node.toHtml()
      }
      return text
    }
    parseToText (data) {
      let nodes = [],
        text = ''
      if (typeof data === 'string') {
        nodes = this.parse(data)
      } else if (data instanceof Array && data[0] instanceof AANode) {
        nodes = data
      } else {
        throw ('解析失败，输入参数有误')
      }
      for (let node of nodes) {
        text += node.toString()
      }
      return text
    }
  }

  const [aaLoader, aaParser] = [new AALoader(), new AAParser()]
  /*
      catalog: [{chapter: '', url: '', title: '', encoding: ''},...]
      bookInfo: {title: '', id: ''}
  */
  class AABook {
    constructor(catalog, bookInfo, path) {
      this.loader = aaLoader
      this.parser = aaParser
      this.catalog = catalog || []
      this.bookInfo = bookInfo || {}
      this.path = pathParser.join(pathParser.resolve(path || '.'), this.bookInfo.id)
      this.dataSource = []
    }
    load () {
      if (this.isExit()) {
        this.catalog = this.readCatalog()
      } else {
        fs.mkdirSync(pathParser.join(this.path, 'source'), { recursive: true })
      }
      console.log(`[AABook] start to load book: (${this.bookInfo.title})`)
      return new Promise((resolve, reject) => {
        let cnt = 0, dataSource = {}
        for (let item of this.catalog) {
          let itemSourcePath = pathParser.join(this.path, 'source', item.chapter + '.html')
          if (fs.existsSync(itemSourcePath) && fs.statSync(itemSourcePath).isFile()) {
            // 读取本地数据
            console.log(`[AABook] load cache data: (chapter-${item.chapter}) ${itemSourcePath}`)
            fs.readFile(itemSourcePath, 'utf8', (err, data) => {
              if (err) {
                console.error(err)
                reject(err)
              }
              // chapter作为数据源的索引
              dataSource[item.chapter] = data

              this.dataSource = dataSource

              cnt++
              console.log(`[AABook] load chapter finished: (chapter-${item.chapter}) ${cnt}/${this.catalog.length}`)
              if (cnt === this.catalog.length) {
                console.log(`[AABook] load book finished: (${this.bookInfo.title})`)
                resolve()
              }
            })
          } else {
            let options = { isLocal: true, encoding: item.encoding },
              urlResult = urlParser.parse(item.url)
            if (urlResult.protocol === 'http' || urlResult.protocol === 'https') {
              options.isLocal = false
            }
            // 获取在线数据，编码为 encoding
            console.log(`[AABook] load online data: (chapter-${item.chapter}) ${item.url}`)
            this.loader.load(item.url, options).then((data) => {
              dataSource[item.chapter] = data
              // 保存在线数据，默认编码为 utf8
              console.log(`[AABook] load data finished: (chapter-${item.chapter}) ${cnt}/${this.catalog.length}`)
              this.loader.save(itemSourcePath, data)

              this.dataSource = dataSource

              cnt++
              console.log(`[AABook] load chapter finished: (chapter-${item.chapter}) ${cnt}/${this.catalog.length}`)
              if (cnt === this.catalog.length) {
                console.log(`[AABook] load book finished: (${this.bookInfo.title})`)
                resolve()
              }
            }).catch(err => {
              reject(err)
            })
          }
        }
      })
    }
    save () {
      if (!this.isExit()) {
        fs.mkdirSync(this.path)
      }
      this.writeCatalog(this.catalog)
      for (let item of this.catalog) {
        let itemPath = pathParser.join(this.path, item.chapter + '.html')
        console.log(`[AABook] save book data: (${this.bookInfo.title}) ${itemPath}`)
        fs.writeFile(itemPath, this.parser.parseToHtml(this.dataSource[item.chapter]), function (err) {
          if (err) {
            console.error(err)
          }
        })
      }
    }
    parseToHtml () {
      let res = {}
      console.log(`[AABook] parse book to html: (${this.bookInfo.title})`)
      for (let item of this.catalog) {
        res[item.chapter] = this.parser.parseToHtml(this.dataSource[item.chapter])
      }
      return res
    }
    isExit () {
      if (fs.existsSync(this.path) &&
        fs.statSync(this.path).isDirectory()) {
        return true
      }
      return false
    }
    readCatalog () {
      let jsonString = ''
      if (fs.existsSync(pathParser.join(this.path, 'uf8', 'CatalogInfo.json'))) {
        jsonString = fs.readFileSync(pathParser.join(this.path, 'CatalogInfo.json'))
      } else {
        jsonString = this.catalog
      }
      return jsonString
    }
    writeCatalog (catalog) {
      let jsonString = JSON.stringify(catalog),
        jsonPath = pathParser.join(this.path, 'CatalogInfo.json')
      console.log(`[AABook] save CatalogInfo.json: (${this.bookInfo.title}) ${jsonPath}`)
      fs.writeFile(jsonPath, jsonString, 'utf8', function (err) {
        if (err) {
          console.error(err)
        }
      })
    }
  }
  return AABook
})()


export default AABook

// let loader = new AALoader(),
//     parser = new AAParser(),
//     option = {
//         isLocal: true
//     }
// loader.load('src/assets/cache/不幸の催眠1.html', option).then(data => {
//     // console.log(data.toString().slice(220, 300))
//     loader.save('../output.html', parser.parseToHtml(data))
//     loader.save('../output.txt', parser.parseToText(data))
// })

// option.isLocal = false
// loader.load('http://jbbs.shitaraba.net/bbs/read.cgi/otaku/15956/1452163665/', option).then(data => {
//     console.log(data.toString().slice(200, 300))
//     loader.save('../output2.html', parser.parseToHtml(data))
// })

// let catalog1 = [{ chapter: '1', url: 'http://jbbs.shitaraba.net/bbs/read.cgi/otaku/15956/1452163665/', title: '1', encoding: 'euc-jp' },
// { chapter: '2', url: 'http://jbbs.shitaraba.net/bbs/read.cgi/otaku/15956/1450955862/', title: '4', encoding: 'euc-jp' }],
//     catalog2 = [{ chapter: '1', url: 'src/assets/cache/不幸の催眠1.html', title: '1', encoding: 'euc-jp' },
//     { chapter: '2', url: 'src/assets/cache/不幸の催眠2.html', title: '4', encoding: 'euc-jp' }],
//     bookInfo = { title: '不幸の催眠', id: '1' }
// let aaBook = new AABook(catalog2, bookInfo, 'cache')

// aaBook.load().then(() => {
//     aaBook.save()
// })