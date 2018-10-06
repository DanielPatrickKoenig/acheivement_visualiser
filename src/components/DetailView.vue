<template>
  <div class="detail-view">
    <div>
      <label class="window-title">
        <span>{{title}}</span>
        <button class="close-button" v-on:click="onClose"></button>
      </label>
      <div class="window-nav">
        <ul>
          <li v-for="(t, k, i) in tabs" :key="'tab'+i.toString()">
            <label :class="currentTab == k ? 'selected-tab breakout-tab' : 'breakout-tab'">{{t.label}}<input type="radio" name="tab_selection" :value="k" v-model="currentTab"/></label>
          </li>
        </ul>
      </div>
      <ul>
        <li v-for="(a, i) in awards" :key="'award_'+i.toString()">
          <label :style="'background-image:url('+getAchiemementImage(a)+');'">{{getAchievmentByID(a.ach_id).name}}</label>
          <table>
            <tr>
              <td>
                <span>Player</span>
              </td>
              <td>
                <span>{{getUserByID(a.user_id).gamertag}}</span>
              </td>
            </tr>
            <tr>
              <td>
                <span>Date</span>
              </td>
              <td>
                <span>{{a.achievement_date.split(' ')[0]}}</span>
              </td>
            </tr>
            <tr>
              <td>
                <span>Time</span>
              </td>
              <td>
                <span>{{a.achievement_date.split(' ')[1]}}</span>
              </td>
            </tr>
          </table>
          <!-- <img :src="getAchievmentByID(a.ach_id).url" /> -->
        </li>
      </ul>
      <pie v-if="currentTab != {}" :chartdata="tabs[currentTab].data" :colors="chartColors" :textcolor="chartTextColor" title="" hovertitle='User' class="pie-break-down"></pie>
      <!-- <bar :chartdata="counts.users" :colors="chartColors" :textcolor="chartTextColor" title="Regional Sales" class="breakout-bar"></bar> -->
    </div>
  </div>
</template>

<script>
import {EventBus} from './EventBus.js'
import PieChartComponent from './PieChartComponent.vue'
export default {
  components: {
    pie: PieChartComponent
  },
  data () {
    return {
      tabs: {
        users: {
          data: {},
          label: 'Gamers'
        },
        achievements: {
          data: {},
          label: 'Achievements'
        },
        dates: {
          data: {},
          label: 'Dates'
        }
      },
      currentTab: 'users',
      chartColors: ['#00aeef', '#fdc689', '#7cc576', '#f26d7d', '#a186be', '#ec008c', '#c69c6d', '#ed145b', '#f26522', '#acd373', '#aba000', '#f5989d'],
      chartTextColor: '#eeeeee'
    }
  },
  methods: {
    getAchievmentByID: function (id) {
      var self = this
      var achievement = {}
      for (var i = 0; i < self.achievements.length; i++) {
        if (self.achievements[i].id === id) {
          achievement = self.achievements[i]
        }
      }
      return achievement
    },
    getUserByID: function (id) {
      var self = this
      var user = {}
      for (var i = 0; i < self.users.length; i++) {
        if (self.users[i].id === id) {
          user = self.users[i]
        }
      }
      return user
    },
    onClose: function (e) {
      EventBus.$emit('on-detail-close', {})
    },
    getAchiemementImage: function (a) {
      var self = this
      var achSplit = self.getAchievmentByID(a.ach_id).url.split('/')
      return 'src/assets/achievements/' + achSplit[achSplit.length - 1]
    }
  },
  props: ['awards', 'achievements', 'users', 'title'],
  mounted: function () {
    var self = this
    var userCounts = {}
    var dateCounts = {}
    var achievementCounts = {}
    // console.log('award conlole log _______________-')
    // console.log(self.awards)
    for (var i = 0; i < self.awards.length; i++) {
      // user counts
      var user = self.getUserByID(self.awards[i].user_id)
      if (userCounts[user.gamertag] === undefined || userCounts[user.gamertag] === null) {
        userCounts[user.gamertag] = 0
      }
      userCounts[user.gamertag] += 1
      // date counts
      var date = self.awards[i].achievement_date.split(' ')[0]
      if (dateCounts[date] === undefined || dateCounts[date] === null) {
        dateCounts[date] = 0
      }
      dateCounts[date] += 1
      // achievement counts
      var achievement = self.getAchievmentByID(self.awards[i].ach_id)
      if (achievementCounts[achievement.name] === undefined || achievementCounts[achievement.name] === null) {
        achievementCounts[achievement.name] = 0
      }
      achievementCounts[achievement.name] += 1
    }
    self.$data.tabs.users.data = userCounts
    self.$data.tabs.achievements.data = achievementCounts
    self.$data.tabs.dates.data = dateCounts
    // self.$data.counts = {users: userCounts, dates: dateCounts, acheivements: achievementCounts}
    // console.log(self.$data.counts)
  }
}
</script>

<style lang="scss" scoped>
div.detail-view{
  background-color: rgba(0,0,0,.85);
  position: fixed;
  left:0;
  top:0;
  right:0;
  bottom:0;
  z-index: 9500;
  color: #eeeeee;
  > div{
    background-color: #333333;
    position:fixed;
    left: 50%;
    top:50%;
    width:700px;
    height:350px;
    margin-left:-350px;
    margin-top:-175px;
    box-shadow: 0 0 0 4px rgba(132,46,171,1);
    > label.window-title{
      height: 30px;
      width:100%;
      display:block;
      background-color: rgba(132,46,171,1);
      > span{
        display: inline-block;
        padding-top:4px;
        padding-left:4px;
        float: left;
        font-weight: bold;
      }
      > button.close-button{
        float: right;
        background-color:transparent;
        border:none;
        color:#ff6a3d;
      }
      > button.close-button::after{
        content: "\2716";
      }
    }
    > div.window-nav{
      width: 70%;
      height: 30px;
      display: inline-block;
      > ul{
        width: auto;
        height: 100%;
        float:left;
        margin:0;
        padding:0;
        > li{
          float: left;
          display: inline-block;
          margin:3px;
          > label{
            width: 140px;
            display:inline-block;
            padding: 5px 7px;
            border-radius: 3px;
            font-size: 12px;
            box-shadow:0 0 0 1px rgba(255,255,255,.6) inset;
            cursor: pointer;
            > input{
              display: none;
            }
          }
          > label.selected-tab{
            background-color: #ffffff;
            color: #333333;
          }
        }
      }
    }
    > ul{
      width: 30%;
      max-height: 320px;
      overflow-y: auto;
      padding: 0;
      margin: 0;
      text-align: left;
      float: right;
      background-color: rgba(255,255,255,.06);
      > li{
        float:none;
        clear:both;
        display: block;
        width:100%;
        margin: 0;
        padding: 10px 0;
        > label{
          background-position: 5px center;
          background-repeat: no-repeat;
          background-size: 25px;
          padding: 10px 5px 10px 35px;
          width: 100%;
          font-size: 12px;
        }
        > table{
          width:100%;
          margin-top:4px;
          tr{
            > td{
              padding: 4px 0;
              margin:0;
              box-shadow: 0 1px 0 rgba(0,0,0,.2) inset;
              > span{
                font-size: 11px;
                display: block;
                padding: 0 8px;
              }
            }
            > td:first-child{
              width:40%;
            }
            > td:last-child{
              width:60%;
            }
          }
        }
      }
    }
  }
}
</style>
