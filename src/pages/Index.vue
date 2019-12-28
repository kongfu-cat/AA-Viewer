<template>
  <q-page>
    <!-- <q-input
      filled
      v-model="url"
      label="URL"
      @keydown.enter="getContent"
    />
    <q-btn @click="getContent">打开</q-btn>
    <q-btn @click="saveContent">保存</q-btn> -->
    <q-tabs
      v-model="tab"
      no-caps
      class="bg-orange text-white shadow-2"
    >
      <q-tab
        v-for="item in catalog"
        :key="item.chapter"
        :name="item.chapter"
        :label="item.title"
      />
    </q-tabs>
    <AAContent
      :aa-content="aaContent"
      class="aa-content"
    ></AAContent>
  </q-page>
</template>

<script>
import AABook from 'src/lib/aaBook.js'
import AAContent from './Content'
export default {
  name: 'PageIndex',
  components: { AAContent },
  data () {
    return {
      url: '',
      tab: '1',
      catalog: [],
      bookInfo: {},
      aaContentData: [],
      aaBook: {}
    }
  },
  methods: {
    // 解析输入的链接
    getContent () {

    },
    // 保存到本地
    saveContent () {

    }
  },
  mounted () {
    this.catalog = [
      { chapter: '1', url: 'src/assets/cache/不幸の催眠1.html', title: '不幸の催眠1', encoding: 'euc-jp' },
      { chapter: '2', url: 'src/assets/cache/不幸の催眠2.html', title: '不幸の催眠2', encoding: 'euc-jp' },
      { chapter: '3', url: 'src/assets/cache/不幸の催眠3.html', title: '不幸の催眠3', encoding: 'euc-jp' },
      { chapter: '4', url: 'src/assets/cache/不幸の催眠4.html', title: '不幸の催眠4', encoding: 'euc-jp' }]

    this.bookInfo = { title: '不幸の催眠', id: '1' }
    this.aaBook = new AABook(this.catalog, this.bookInfo, 'cache')

    let timeID = setInterval(() => {
      console.log('interval: update the aaContentData')
      this.aaContentData = this.aaBook.parseToHtml()
    }, 30000)

    console.log('start to load the aabook')
    this.aaBook.load().then(() => {
      console.log('interval: clear the interval')
      this.aaContentData = this.aaBook.parseToHtml()
      clearInterval(timeID)
    })
  },
  computed: {
    aaContent () {
      return this.aaContentData[this.tab] || '无内容'
    }
  }
}
</script>

<style scoped>
.aa-content {
  font-family: "Textar", "MS PGothic", "IPAMonaPGothic", "Mona", sans-serif;
}
</style>
