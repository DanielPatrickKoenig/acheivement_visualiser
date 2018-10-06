<template>
  <div :id="componentID" class="oversized-element" :style="'opacity:'+componentProps.opacity+';'">
    <span :class="labelStyle" v-for="(l, k, i) in labelList" :key="'label_'+k.toString()+'_'+i.toString()" :style="'left:'+l.x.toString()+'px;top:'+l.y.toString()+'px;'" v-on:click="showDetailView(l.text)">{{l.text}}</span>
    <svg v-if="labelStyle == 'achievement'">
      <line v-for="(c, i) in lineCoords" :key="'line_'+i.toString()" :x1="c.x1" :x2="c.x2" :y1="c.y1" :y2="c.y2"></line>
    </svg>
    <svg v-if="labelStyle == 'date'">
      <rect v-for="(l, k, i) in labelList" :key="'rect_'+i.toString()" :x="l.x-3" :y="l.y" width="183" height="206"></rect>
    </svg>
  </div>
</template>

<script>
import {EventBus} from './EventBus.js'
import {getOrbit} from './v4v/Trig.js'
import {TweenLite} from 'gsap'
export default {
  props: ['labels', 'labelclass'],
  data () {
    return {
      componentID: 'com_' + Math.random().toString().split('.').join('') + Math.random().toString().split('.').join('') + Math.random().toString().split('.').join(''),
      lineCoords: [],
      labelList: {},
      labelStyle: 'default',
      componentProps: {
        opacity: 0
      }
    }
  },
  methods: {
    getLineCoords: function () {
      // var self = this
      var lc = []
      // var bounds = document.getElementById(self.$data.componentID).getBoundingClientRect()
      var center = {x: 1000, y: 500}
      var length = 16
      for (var i = 0; i < length; i++) {
        var angle = (360 / length) * (i + 0.5)
        var x1 = getOrbit(center.x, 30, angle, 'cos')
        var x2 = getOrbit(center.x, 350, angle, 'cos')
        var y1 = getOrbit(center.y, 30, angle, 'sin')
        var y2 = getOrbit(center.y, 350, angle, 'sin')
        lc.push({x1: x1, x2: x2, y1: y1, y2: y2})
      }
      return lc
    },
    showDetailView: function (key) {
      EventBus.$emit('show-detail-view', {key: key})
    }
  },
  watch: {
    labels: function () {
      var self = this
      TweenLite.to(self.$data.componentProps, 1, {
        opacity: 0,
        onComplete: function () {
          self.$data.labelList = self.labels
          self.$data.labelStyle = self.labelclass
          TweenLite.to(self.$data.componentProps, 1, {opacity: 1})
        }
      })
    }
  },
  mounted: function () {
    var self = this
    self.$data.lineCoords = self.getLineCoords()
  }
}
</script>

<style lang="scss" scoped>
svg{
  
}
div{
  > span{
    display: inline-block;
    position: absolute;
    cursor: pointer;

  }
  > span:hover{
    text-decoration: underline;
  }
  > span.user{
    text-align:right;
    width: 200px;
    font-size: 11px;
  }
  > span.achievement{
    text-align:center;
    width: 200px;
    font-size: 11px;
    margin-left: -100px;
  }
  > span.date{
    text-align:left;
    width: 200px;
    font-size: 14px;
  }
  > span.default{
    text-align:center;
    width: 400px;
    font-size: 20px;
  }
  >svg{
    width: 100%;
    height: 100%;
    > line {
      stroke: rgba(0,0,0,.3);
    }
    > rect{
      stroke: rgba(0,0,0,.3);
      fill: transparent;
    }
  }
}
</style>
