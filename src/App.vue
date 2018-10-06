<template>
  <div id="app">
    <!-- <canvas style="width:1000px;height:1000px;" id="canvas"></canvas> -->
    <div :id="containerID" class="oversized-element" :style="'transform: scale('+windowProps.scale+')'"></div>
    <div v-if="isIE"></div>
    <overlay :labels="labelMatrix" :labelclass="labelStyle" :style="'transform: scale('+windowProps.scale+')'"></overlay>
    <div class="app-header">
      <span>Habitapp Activity Data - Round 1</span>
      <!-- <button v-on:click="isPlaying = !isPlaying">{{isPlaying ? 'Pause' : 'Play'}}</button> -->
    </div>
    <div v-for="(m, k, i) in modes" :key="'modemessage_'+i.toString()+'_'+k" v-if="modeStates[m] != undefined && modeStates[m] != null" style="opacity:0;" :id="'modelabel_'+m.toString()" :class="isPlaying ? 'autoplay-message' : 'autoplay-message-hidden'"><span>{{getModeMessage(m)}}</span></div>
    <div class="user-interface">
      <div :class="filtersOpen ? 'ui-icons open' : 'ui-icons'">
        <label class="mode-selection" style="background-image:url(src/assets/icons/filter.svg);">
          <input type="checkbox" v-model="filtersOpen" />
        </label>
        <label v-for="(m, k, i) in modes" :key="'mode_radio_'+k.toString()+'_'+i.toString()" :class="mode == m ? 'mode-selection selected' : 'mode-selection'" v-if="i > 0" :style="'background-image:url('+getModeIcon(m)+');'">
          <input type="radio" name="mode_selection" v-model="mode"  :value="m" v-on:change="onModeLabelClicked" />
        </label>
        <label class="mode-selection" style="background-image:url(src/assets/icons/info.svg);position:absolute;bottom:0;left:0;">
        </label>
      </div>
      <!-- <select id="targetedelement" v-model="mode" v-on:change="onModeChange">
        <option v-for="(m, k, i) in modes" :key="'mode_'+i.toString()" :value="m">
          {{k}}
        </option>
      </select> -->
      <!-- <button v-on:click="isPlaying = !isPlaying">{{isPlaying ? 'Pause' : 'Play'}}</button> -->
      
      <div class="filter-container" v-if="filtersOpen">
        <div class="filter-selector">
          <label for="achievement_list">Achievements</label><input type="checkbox" id="achievement_list"/>
          <div>
            <label v-for="(a, i) in achievements" :key="'ach_'+i.toString()">
              <input type="checkbox" v-model="selectedAchievements" v-on:change="onModeChange" :value="a.id" />
              {{a.name}}
            </label>
          </div>
        </div>

        <!-- <div class="filter-selector">
          <label for="user_list">Users</label><input type="checkbox" id="user_list"/>
          <div>
            <label v-for="(u, i) in usersWithAwards" :key="'user_'+i.toString()">
              <input type="checkbox" v-model="selectedUsers" v-on:change="onModeChange" :value="u.id" />
              {{u.gamertag}}
            </label>
          </div>
        </div> -->

        <div class="filter-selector">
          <label for="date_list">Dates</label><input type="checkbox" id="date_list"/>
          <div>
            <label v-for="(d, k, i) in getDateGroups()" :key="'date_'+i.toString()">
              <input type="checkbox" v-model="selectedDates" v-on:change="onModeChange" :value="k" />
              {{k}}
            </label>
          </div>
        </div>

        <div class="filter-selector" v-for="(f, k, i) in userFilters" :key="'filter_'+k.toString()+'.'+i.toString()">
          <label :for="'filter_'+k.toString()+'.'+i.toString()">{{f.label}}</label><input type="checkbox" :id="'filter_'+k.toString()+'.'+i.toString()"/>
          <div>
            <label v-for="(o, j) in f.options" :key="'filter_option_'+k.toString()+'.'+i.toString()+'.'+j.toString()"><input type="checkbox" :name="o.label" :value="o.id" v-model="f.currentValues" v-on:change="onModeChange"/>{{o.label}}</label>
          </div>
        </div>
      </div>
      
    </div>
    <detail v-if="showDetail" :title="detailKey" :awards="detailList" :achievements="achievements" :users="users"></detail>
  </div>
</template>

<script>
import {EventBus} from './components/EventBus.js'
import axios from 'axios'
import {getOrbit} from './components/v4v/Trig.js'
import {FILTERMODES} from './components/FILTERMODES.js'
import {TweenLite, Circ} from 'gsap'
import LabelOverlay from './components/labelOverlay.vue'
import DetailView from './components/DetailView.vue'
import {arrayContains, debugTrace} from './components/utils/utilities.js'
export default {
  name: 'app',
  components: {
    overlay: LabelOverlay,
    detail: DetailView
  },
  data () {
    return {
      awards: [],
      users: [],
      userGroupList: {},
      achievements: [],
      dates: [],
      renderReady: false,
      baseSize: 21,
      filtersOpen: false,
      baseProps: {
        size: 21
      },
      stageDimensions: {width: 1000, height: 800},
      positions: [],
      cPlanePosition: {x: 10, y: 0, z: 0, rx: 0, ry: 0, rz: 0, sx: 0, sy: 0, sz: 0},
      stageStart: {x: 60, y: 30},
      mode: FILTERMODES.DEFAULT,
      modes: FILTERMODES,
      modeStates: {},
      modeList: [FILTERMODES.DEFAULT, FILTERMODES.USER, FILTERMODES.DATE, FILTERMODES.ACHIEVEMENT],
      modeIndex: 0,
      selectedUser: -1,
      selectedAchievement: -1,
      selectedDate: -1,
      selectedUsers: [],
      selectedAchievements: [],
      selectedDates: [],
      THREE: {},
      camera: {},
      cameraPoint: {x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0},
      cameraAngle: 0,
      scene: {},
      renderer: {},
      containerID: 'stage_' + Math.random().toString().split('.').join('') + Math.random().toString().split('.').join('') + Math.random().toString().split('.').join(''),
      planes: [],
      materials: [],
      fonts: {
        regular: {}
      },
      labelMatrix: {},
      labelStyle: 'default',
      isPlaying: true,
      displayMatrix: [],
      userFilters: {
        gender: {
          exclusive: true,
          label: 'Gender',
          property: 'gender',
          options: [{id: 0, label: 'Female', selected: false}, {id: 1, label: 'Male', selected: false}],
          currentValue: -1,
          currentValues: []
        },
        strength: {
          exclusive: false,
          label: 'Strength',
          property: 'strength_categories',
          options: [{id: 1, label: 'Influence', selected: false}, {id: 2, label: 'Execution', selected: false}, {id: 3, label: 'Relationship', selected: false}, {id: 4, label: 'Thinking', selected: false}],
          currentValue: -1,
          currentValues: []
        },
        generation: {
          exclusive: true,
          label: 'Generation',
          property: 'generation',
          options: [{id: 3, label: 'Gen X', selected: false}, {id: 2, label: 'Millennial', selected: false}, {id: 1, label: 'Gen Z', selected: false}],
          currentValue: -1,
          currentValues: []
        }
      },
      windowProps: {
        scale: 1,
        standardHeight: 938
      },
      detailList: [],
      showDetail: false,
      detailKey: '',
      verbs: {}
      // canvas: {},
      // context: {},
      // cPlane: {},
      // texture: {}
    }
  },
  methods: {
    updateLabels: function () {
      var self = this
      self.labelMatrix = {}
      var offset = {}
      switch (self.$data.mode) {
        case FILTERMODES.USER:
        {
          self.$data.labelStyle = 'user'
          offset = {x: 465, y: 102.5}
          var userGroups = self.getUserGroups()
          var left = 0
          var top = 0
          var maxTop = 40
          for (var u in userGroups) {
            var xVal = left * 489
            var yVal = top * 19.18
            self.labelMatrix[u] = {x: xVal + offset.x, y: yVal + offset.y, text: u}
            top++
            if (top > maxTop) {
              top = 0
              left++
            }
          }
          break
        }
        case FILTERMODES.ACHIEVEMENT:
        {
          self.$data.labelStyle = 'achievement'
          var center = {x: 1000, y: 500}
          var achievementGroups = self.getAchiementGroups()
          var orbitRadius = 320
          for (var i = 0; i < achievementGroups.length; i++) {
            self.labelMatrix[i] = {x: getOrbit(center.x, orbitRadius, ((360 / achievementGroups.length) * i) - 90, 'cos'), y: getOrbit(center.y, orbitRadius, ((360 / achievementGroups.length) * i) - 90, 'sin'), text: self.$data.achievements[i].name}
          }
          break
        }
        case FILTERMODES.DATE:
        {
          offset = {x: 142, y: 190}
          var ver = 0
          var hor = 0
          var footprint = {x: 187, y: 210}
          var dateGroups = self.getDateGroups()
          var dayList = []
          for (var d in dateGroups) {
            var thisDate = d.split(' ')[0]
            var from = thisDate.split('/')
            var f = new Date(from[2], from[0] - 1, from[1])
            var dayOfWeek = f.getDay()
            hor = dayOfWeek
            if (dayList.length > 0 && Number(dayOfWeek) < Number(dayList[dayList.length - 1])) {
              ver++
            }
            dayList.push(dayOfWeek)
            self.labelMatrix[d] = {x: offset.x + (footprint.x * hor), y: offset.y + (footprint.y * ver), text: d}
          }
          self.$data.labelStyle = 'date'
          break
        }
        case FILTERMODES.DEFAULT:
        {
          self.$data.labelStyle = 'default'
          break
        }
      }
    },
    addSphere: function () {
      var self = this
      var sphere = new self.$data.THREE.SphereGeometry(100, 100, 40)
      sphere.applyMatrix(new self.$data.THREE.Matrix4().makeScale(-1, 1, 1))
      var sphereMaterial = new self.$data.THREE.MeshBasicMaterial()
      sphereMaterial.map = self.$data.THREE.ImageUtils.loadTexture('src/assets/panoramas/solack_4.jpg')
      var sphereMesh = new self.$data.THREE.Mesh(sphere, sphereMaterial)
      self.$data.scene.add(sphereMesh)
    },
    getAllAwards: function () {
      var self = this
      debugTrace('getAllAwards called')
      // self.$data.canvas = document.getElementById('canvas')
      // self.$data.context = self.$data.canvas.getContext('2d')
      self.$data.THREE = require('three')
      axios.get('src/assets/round1/awards.txt').then(response => {
        self.$data.awards = response.data
        for (var i = 0; i < self.$data.awards.length; i++) {
          self.$data.positions.push({x: 0, y: 0})
        }
        // self.$data.positions = self.getPositions()
        self.getAchievements()
      })
    },
    getAchievements: function () {
      var self = this
      debugTrace('getAchievements called')
      axios.get('src/assets/achievements.txt').then(response => {
        self.$data.achievements = response.data
        self.getUsers()
      })
    },
    getUsers: function () {
      var self = this
      debugTrace('getUsers called')
      axios.get('src/assets/round1/users.txt').then(response => {
        self.$data.users = response.data
        // self.getFont()
        self.beginRender()
      })
      /*
      axios.get('src/assets/round1/verbs.txt').then(response => {
        self.$data.verbs = response.data
      })
      // */
    },
    getFont: function () {
      var self = this
      var loader = new self.$data.THREE.FontLoader()
      loader.load('src/assets/fonts/helvetiker_regular.typeface.json',
        function (font) {
          self.$data.fonts.regular = font
          self.beginRender()
        }
      )
    },
    createPlanes: function (handler) {
      var self = this
      debugTrace('createPlanes started')
      self.addSphere()
      self.addPlaneDelay(0, handler)
      // for (var i = 0; i < self.$data.awards.length; i++) {
      //   var pathSplit = self.getAchievementByID(self.$data.awards[i].ach_id).url.split('/')
      //   var plane = self.addPlane('src/assets/achievements/' + pathSplit[pathSplit.length - 1], 0, 0, 0)
      //   plane.name = i
      //   self.$data.planes.push(plane)
      // }
      // if (handler !== undefined && handler !== null) {
      //   handler()
      // }
      debugTrace('createPlanes ended')
    },
    getModeIcon: function (m) {
      var lableTxt = ''
      switch (m) {
        case FILTERMODES.USER:
        {
          lableTxt = 'src/assets/icons/user.svg'
          break
        }
        case FILTERMODES.ACHIEVEMENT:
        {
          lableTxt = 'src/assets/icons/acheivement.svg'
          break
        }
        case FILTERMODES.DATE:
        {
          lableTxt = 'src/assets/icons/date.svg'
          break
        }
        case FILTERMODES.DEFAULT:
        {
          lableTxt = ''
          break
        }
      }
      return lableTxt
    },
    getModeMessage: function (m) {
      var self = this
      var lableTxt = ''
      switch (m) {
        case FILTERMODES.USER:
        {
          lableTxt = 'Some players unlocked more than others...'
          break
        }
        case FILTERMODES.ACHIEVEMENT:
        {
          lableTxt = '...there were 16 ways to earn points.'
          break
        }
        case FILTERMODES.DATE:
        {
          lableTxt = '...in a two week competition...'
          break
        }
        case FILTERMODES.DEFAULT:
        {
          lableTxt = self.$data.awards.length + ' unlocked achievements'
          break
        }
      }
      return lableTxt
    },
    reconfigure: function () {
      var self = this
      self.updateLabels()
      var shrinkage = 12
      var randAngleMax = 90
      self.moveCamera({x: 0, y: 0, z: 0, rx: (self.$data.cameraPoint.rx * (180 / Math.PI)) + (Math.random() * randAngleMax) - (randAngleMax / 2), ry: (self.$data.cameraPoint.ry * (180 / Math.PI)) + (Math.random() * randAngleMax) - (randAngleMax / 2), rz: (self.$data.cameraPoint.rz * (180 / Math.PI)) + (Math.random() * randAngleMax) - (randAngleMax / 2)}, 0.75, function () {
        var yRot = 0
        switch (self.$data.mode) {
          case FILTERMODES.DEFAULT:
          {
            yRot = -180
            break
          }
          case FILTERMODES.USER:
          {
            yRot = 0
            break
          }
          case FILTERMODES.ACHIEVEMENT:
          {
            yRot = -90
            break
          }
          case FILTERMODES.DATE:
          {
            yRot = 90
          }
        }
        self.moveCamera({x: 0, y: 0, z: 0, rx: 0, ry: yRot, rz: 0}, 0.75)
      })
      for (var i = 0; i < self.$data.awards.length; i++) {
        self.movePlane(self.$data.planes[i], {x: ((Math.random() * 1000) - 500) / shrinkage, y: ((Math.random() * 1000) - 500) / shrinkage, z: ((Math.random() * 1000) - 500) / shrinkage, rx: (Math.random() * 360), ry: (Math.random() * 360), rz: (Math.random() * 360), sx: 0.5 + (Math.random() * 0.5), sy: 0.5 + (Math.random() * 0.5), sz: 0.5 + (Math.random() * 0.5)}, 1, i, function () {
          for (var i = 0; i < self.$data.planes.length; i++) {
            self.movePlane(self.$data.planes[i], {x: self.$data.positions[i].x / shrinkage, y: self.$data.positions[i].y / shrinkage, z: self.$data.positions[i].z / shrinkage, rx: self.$data.positions[i].rx, ry: self.$data.positions[i].ry, rz: self.$data.positions[i].rz, sx: self.$data.positions[i].sx, sy: self.$data.positions[i].sy, sz: self.$data.positions[i].sz}, 1)
          }
        })
      }
    },
    beginRender: function () {
      var self = this
      self.$data.renderReady = true
      self.reposition()
      var _width = document.getElementById(self.$data.containerID).getBoundingClientRect().width
      var _height = document.getElementById(self.$data.containerID).getBoundingClientRect().height
      var containerElement = document.getElementById(self.$data.containerID)
      self.$data.renderer = new self.$data.THREE.WebGLRenderer({alpha: true})
      // self.$data.renderer = new self.$data.THREE.WebGLRenderer()
      self.$data.renderer.setSize(_width, _height)
      containerElement.appendChild(self.$data.renderer.domElement)
      self.$data.scene = new self.$data.THREE.Scene()
      self.$data.camera = new self.$data.THREE.PerspectiveCamera(75, _width / _height, 1, 1000)
      self.$data.target = new self.$data.THREE.Vector3(0, 0, 0)
      self.$data.blankMaterial = new self.$data.THREE.MeshBasicMaterial({color: 0x000000, side: self.$data.THREE.DoubleSide})
      // var plane = self.addPlane(self.getAchievementByID(self.$data.awards[i].ach_id).url, 0, 0, 0)
      self.createPlanes(function () {
        self.reconfigure()
        setInterval(function () {
          self.$data.windowProps.scale = window.innerHeight / self.$data.windowProps.standardHeight
          self.$data.cameraAngle += 0.02
          if (self.$data.mode === FILTERMODES.DEFAULT) {
            self.$data.cameraPoint.ry += 0.003
            // self.$data.cameraPoint.rx += 0.004
          }
          self.$data.camera.rotation.set(self.$data.cameraPoint.rx, self.$data.cameraPoint.ry, self.$data.cameraPoint.rz)
          self.$data.renderer.render(self.$data.scene, self.$data.camera)
        }, 30)
        self.$data.modeIndex = -1
        self.autoForward()
      })
    },
    autoForward: function () {
      var self = this
      if (self.$data.isPlaying) {
        self.$data.modeIndex++
        if (self.$data.modeIndex >= self.$data.modeList.length) {
          self.$data.modeIndex = 0
          self.$data.isPlaying = false
        }
        self.$data.mode = self.$data.modeList[self.$data.modeIndex]
        self.onModeChange()
      }
      setTimeout(self.autoForward, 5000)
    },
    getAchievementByID: function (id) {
      var self = this
      var ach = {}
      for (var i = 0; i < self.$data.achievements.length; i++) {
        if (id === self.$data.achievements[i].id) {
          ach = self.$data.achievements[i]
        }
      }
      return ach
    },
    getUserByID: function (id) {
      var self = this
      var usr = {}
      for (var i = 0; i < self.$data.users.length; i++) {
        if (id === self.$data.users[i].id) {
          usr = self.$data.users[i]
        }
      }
      return usr
    },
    arrayCheck: function (arr, val) {
      return arr === undefined || arrayContains(arr, val) || arr.length === 0
    },
    updateDisplayMatrix: function () {
      var self = this
      self.$data.displayMatrix = []
      // var mainIndex = 0
      // console.log(self.$data.users)
      for (var i = 0; i < self.$data.awards.length; i++) {
        // var achievementCheck = self.$data.awards[i].ach_id === self.$data.selectedAchievement || self.$data.selectedAchievement === -1
        // var userCheck = Number(self.$data.awards[i].user_id) === Number(self.$data.selectedUser) || self.$data.selectedUser === -1
        var achievementCheck = self.arrayCheck(self.$data.selectedAchievements, self.$data.awards[i].ach_id)
        var userCheck = self.arrayCheck(self.$data.selectedUsers, Number(self.$data.awards[i].user_id))
        var dateCheck = self.arrayCheck(self.$data.selectedDates, self.$data.awards[i].achievement_date.split(' ')[0])
        var userFilterCheck = self.applyUserFilter(self.$data.awards[i])
        self.$data.displayMatrix.push(self.$data.mode === FILTERMODES.DEFAULT || (achievementCheck && userCheck && dateCheck && userFilterCheck))
      }
    },
    getPositions: function () {
      var self = this
      var shrinkage = 3
      var positions = []
      var i = 0
      var j = 0
      var k = 0
      var offPos = {x: 0, y: 1000, z: 0}
      // var displayMatrix = []
      // var mainIndex = 0
      var kIndex = 0
      // for (i = 0; i < self.$data.awards.length; i++) {
      //   var achievementCheck = self.$data.awards[i].ach_id === self.$data.selectedAchievement || self.$data.selectedAchievement === -1
      //   var userCheck = self.$data.awards[i].user_id === self.$data.selectedUser || self.$data.selectedUser === -1
      //   var dateCheck = true
      //   displayMatrix.push(achievementCheck && userCheck && dateCheck)
      // }
      self.updateDisplayMatrix()
      switch (self.$data.mode) {
        case FILTERMODES.DEFAULT:
        {
          // var h = 0
          // var v = 0
          // var cols = 20
          var angleInterval = 10
          var currentAngle = 0
          var angleIndex = 0
          var radius = 120
          var intemIndex = 0
          var yJump = 20
          var baseY = ((self.filteredAwards.length / (360 / angleInterval)) / 2) * yJump
          for (i = 0; i < self.filteredAwards.length; i++) {
            // var extraLeft = v / 2 === Math.round(v / 2) ? self.$data.baseSize : 0
            if (self.$data.displayMatrix[i]) {
              // positions.push({
              //   x: self.$data.stageStart.x + (h * (self.$data.baseSize * 2)) - 200 + extraLeft,
              //   y: -60,
              //   z: self.$data.stageStart.y + (v * (self.$data.baseSize * 1.75)) - 200,
              //   rx: 90,
              //   ry: 0,
              //   rz: 0,
              //   sx: 0.5,
              //   sy: 0.5,
              //   sz: 0.5
              // })
              currentAngle = intemIndex * angleInterval
              if (currentAngle >= 360) {
                currentAngle = 0
                angleIndex++
                intemIndex = 0
              }
              var radiusOffset = 0
              var oddEvenOffset = angleIndex / 2 === Math.round(angleIndex / 2) ? 0 : angleInterval / 2
              positions.push({
                x: getOrbit(40, radius + radiusOffset, currentAngle + oddEvenOffset, 'cos'),
                y: (yJump * angleIndex * -1) + baseY,
                z: getOrbit(30, radius + radiusOffset, currentAngle + oddEvenOffset, 'sin'),
                rx: 0,
                ry: currentAngle * -1,
                rz: 0,
                sx: 0.3,
                sy: 0.3,
                sz: 0.3
              })
              intemIndex++
              // h++
            } else {
              positions.push(offPos)
            }
            positions[positions.length - 1]._x = positions[positions.length - 1].x
            positions[positions.length - 1]._y = positions[positions.length - 1].z
            // positions.push({x: self.$data.stageStart.x + (h * (self.$data.baseSize * 2)) + extraLeft, y: self.$data.stageStart.y + (v * (self.$data.baseSize * 1.75))})
            // if (h > cols) {
            //   h = 0
            //   v++
            // }
          }
          break
        }
        case FILTERMODES.USER:
        {
          var userGroups = self.getUserGroups()
          // console.log(userGroups)
          // mainIndex = 0
          var top = 0
          var left = 0
          var maxTop = 40
          for (var u in userGroups) {
            // var shouldUIndex = false
            kIndex = 0
            for (k = 0; k < userGroups[u].length; k++) {
              if (self.$data.displayMatrix[userGroups[u][k].index]) {
                positions[userGroups[u][k].index] = {
                  z: -200,
                  x: self.$data.stageStart.x + (kIndex * (self.$data.baseSize * (2 / (shrinkage * 3)))) - ((self.$data.stageDimensions.height / 2) / 2.5) + (left * 150),
                  y: ((self.$data.stageStart.y + (top * (self.$data.baseSize * (3 / (shrinkage * 1.7)))) - ((self.$data.stageDimensions.width / 2) / 5)) * -1) + 50,
                  rx: 0,
                  ry: 0,
                  rz: 0,
                  sx: 0.05,
                  sy: 0.05,
                  sz: 0.05
                }
                // shouldUIndex = true
                kIndex++
              } else {
                positions[userGroups[u][k].index] = offPos
              }
              positions[userGroups[u][k].index]._x = positions[userGroups[u][k].index].x
              positions[userGroups[u][k].index]._y = positions[userGroups[u][k].index].y
              // mainIndex++
              // console.log(mainIndex)
            }
            top++
            if (top > maxTop) {
              top = 0
              left++
            }
          }
          break
        }
        case FILTERMODES.ACHIEVEMENT:
        {
          var achievementGroups = self.getAchiementGroups()
          var largestGroupSize = 0
          for (j = 0; j < achievementGroups.length; j++) {
            var countIndex = 0
            for (k = 0; k < achievementGroups[j].length; k++) {
              if (self.$data.displayMatrix[achievementGroups[j][k].index]) {
                countIndex++
              }
            }
            if (countIndex > largestGroupSize) {
              largestGroupSize = countIndex
            }
          }
          var itteratorDivider = 46
          var itterator = itteratorDivider / largestGroupSize
          // console.log('largest group length = ' + largestGroupSize.toString())
          for (j = 0; j < achievementGroups.length; j++) {
            kIndex = 0
            switch (largestGroupSize) {
              case 1:
              {
                kIndex = itteratorDivider
                break
              }
              case 2:
              {
                kIndex = itteratorDivider / 3
                break
              }
            }
            // kIndex = largestGroupSize > 1 ? 0 : itteratorDivider
            for (k = 0; k < achievementGroups[j].length; k++) {
              if (self.$data.displayMatrix[achievementGroups[j][k].index]) {
                positions[achievementGroups[j][k].index] = {
                  x: 200 - kIndex,
                  y: getOrbit(0, 10 + (1 * kIndex), ((360 / achievementGroups.length) * j), 'cos'),
                  z: getOrbit(0, 10 + (1 * kIndex), ((360 / achievementGroups.length) * j), 'sin'),
                  rx: 0,
                  ry: 90,
                  rz: 0,
                  sx: 0.04 + (kIndex * 0.01),
                  sy: 0.04 + (kIndex * 0.01),
                  sz: 0.04 + (kIndex * 0.01)
                }
                kIndex += itterator
              } else {
                positions[achievementGroups[j][k].index] = offPos
              }
              positions[achievementGroups[j][k].index]._x = positions[achievementGroups[j][k].index].z
              positions[achievementGroups[j][k].index]._y = positions[achievementGroups[j][k].index].y
            }
          }
          break
        }
        case FILTERMODES.DATE:
        {
          var dateGroups = self.getDateGroups()
          var dayList = []
          var hor = 0
          var ver = 0
          for (var d in dateGroups) {
            var from = d.split('/')
            var f = new Date(from[2], from[0] - 1, from[1])
            var dayOfWeek = f.getDay()
            hor = dayOfWeek
            if (dayList.length > 0 && Number(dayOfWeek) < Number(dayList[dayList.length - 1])) {
              ver++
            }
            dayList.push(dayOfWeek)
            // console.log(hor.toString() + '/' + ver.toString())
            // var dateOfMonth = f.getDate()
            // var monthOfYear = f.getMonth()
            // console.log('ACTUAL DATE - ' + d)
            // console.log('DAY OF WEEK - ' + dayOfWeek.toString())
            // console.log('DAY OF MONTH - ' + monthOfYear.toString() + '.' + dateOfMonth.toString())
            var groupOffset = {x: (hor * 40) - 180, y: (ver * 45) - 60}
            var _hor = 0
            var _ver = 0
            var _cols = 9
            var footprint = 3
            for (k = 0; k < dateGroups[d].length; k++) {
              if (self.$data.displayMatrix[dateGroups[d][k].index]) {
                var oddEvenShift = _ver / 2 === Math.round(_ver / 2) ? footprint / 2 : 0
                positions[dateGroups[d][k].index] = {
                  x: -140,
                  y: (groupOffset.y + (_ver * (footprint * 0.9))) * -1,
                  z: (groupOffset.x + (_hor * footprint) + oddEvenShift) * -1,
                  rx: 0,
                  ry: -90,
                  rz: 0,
                  sx: 0.075,
                  sy: 0.075,
                  sz: 0.075
                }
                _hor++
                if (_hor > _cols) {
                  _ver++
                  _hor = 0
                }
              } else {
                positions[dateGroups[d][k].index] = offPos
              }
              positions[dateGroups[d][k].index]._x = positions[dateGroups[d][k].index].z
              positions[dateGroups[d][k].index]._y = positions[dateGroups[d][k].index].y
            }
          }
          break
        }
      }
      return positions
    },
    getSize: function () {
      var self = this
      var size = 0
      switch (self.$data.mode) {
        case FILTERMODES.DEFAULT:
        {
          size = 21
          break
        }
        case FILTERMODES.USER:
        {
          size = 10
          break
        }
        case FILTERMODES.ACHIEVEMENT:
        {
          size = 12
          break
        }
        case FILTERMODES.DATE:
        {
          size = 14
          break
        }
      }
      return size
    },
    reposition: function () {
      var self = this
      self.$data.baseSize = self.getSize()
      self.$data.positions = self.getPositions()
    },
    onUserFilterChecked: function (filter, id) {
      var self = this
      if (arrayContains(filter.currentValues, id)) {
        for (var i = filter.currentValues.length - 1; i >= 0; i--) {
          filter.currentValues.splice(i, 1)
        }
      } else {
        filter.currentValues.push(id)
      }
      self.onModeChange()
    },
    onModeLabelClicked: function (e) {
      var self = this
      self.$data.isPlaying = false
      self.onModeChange(e)
    },
    onModeChange: function (e) {
      var self = this
      for (var m in self.$data.modes) {
        if (self.$data.mode !== self.$data.modes[m]) {
          TweenLite.to(self.$data.modeStates[self.$data.modes[m]], 0.5, {
            o: 0,
            onUpdate: function (val, _m) {
              document.getElementById('modelabel_' + _m).style.opacity = val.o
            },
            onUpdateParams: [self.$data.modeStates[self.$data.modes[m]], self.$data.modes[m]]
          })
        }
      }
      TweenLite.to(self.$data.modeStates[self.$data.mode], 0.5, {
        o: 1,
        onUpdate: function (val, _m) {
          document.getElementById('modelabel_' + _m).style.opacity = val.o
          // console.log(self.$data.modeStates)
        },
        onUpdateParams: [self.$data.modeStates[self.$data.mode], self.$data.mode]
      })
      self.reposition()
      self.reconfigure()
    },
    addPlane: function (image, x, y, z) {
      var self = this
      var geometry = new self.$data.THREE.PlaneGeometry(4, 4, 32)
      var material = new self.$data.THREE.MeshBasicMaterial({side: self.$data.THREE.DoubleSide, transparent: true})
      self.$data.materials.push(material)
      var plane = new self.$data.THREE.Mesh(geometry, material)
      plane.position.set(x, y, z)
      self.$data.scene.add(plane)
      material.map = new self.$data.THREE.TextureLoader().load(image)
      return plane
    },
    addPlaneDelay: function (index, handler) {
      var self = this
      debugTrace('addPlaneDelay called - ' + index.toString())
      if (self.$data.awards.length > index) {
        setTimeout(function (n) {
          var pathSplit = self.getAchievementByID(self.$data.awards[n].ach_id).url.split('/')
          var plane = self.addPlane('src/assets/achievements/' + pathSplit[pathSplit.length - 1], 0, 0, 0)
          plane.name = n
          self.$data.planes.push(plane)
          self.addPlaneDelay(n + 1, handler)
        }, 50, index)
      } else {
        if (handler !== null && handler !== null) {
          handler()
        }
      }
    },
    addText: function (text) {
      var self = this
      var txtGeo = new self.$data.THREE.TextGeometry(text, {
        font: self.$data.fonts.regular,
        size: 80,
        height: 5,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 2,
        bevelSize: 8,
        bevelSegments: 5
      })
      self.$data.scene.add(txtGeo)
      return txtGeo
    },
    moveCamera: function (props, time, onMoveComplete) {
      var self = this
      var moveComplete = onMoveComplete !== undefined ? onMoveComplete : function () {}
      var camPoint = {x: self.$data.cameraPoint.x, y: self.$data.cameraPoint.y, z: self.$data.cameraPoint.z, rx: self.$data.cameraPoint.rx, ry: self.$data.cameraPoint.ry, rz: self.$data.cameraPoint.rz}
      TweenLite.to(camPoint, time, {
        x: props.x,
        y: props.y,
        z: props.z,
        rx: props.rx === undefined ? self.$data.cameraPoint.rx : props.rx * (Math.PI / 180),
        ry: props.ry === undefined ? self.$data.cameraPoint.ry : props.ry * (Math.PI / 180),
        rz: props.rz === undefined ? self.$data.cameraPoint.rz : props.rz * (Math.PI / 180),
        onUpdate: function () {
          self.$data.cameraPoint.x = camPoint.x
          self.$data.cameraPoint.y = camPoint.y
          self.$data.cameraPoint.z = camPoint.z
          self.$data.cameraPoint.rx = camPoint.rx
          self.$data.cameraPoint.ry = camPoint.ry
          self.$data.cameraPoint.rz = camPoint.rz
          // console.log(self.paralax.x)
          // console.log(self.$data.cameraPoint.ry * (180 / Math.PI))
        },
        onComplete: moveComplete,
        ease: Circ.easeInOut
      })
    },
    movePlane: function (plane, props, time, completeIndex, onMoveComplete) {
      var self = this
      var planePoint = {x: plane.position.x, y: plane.position.y, z: plane.position.z, rx: plane.rotation.x, ry: plane.rotation.y, rz: plane.rotation.z, sx: plane.scale.x, sy: plane.scale.y}
      TweenLite.to(planePoint, time, {
        x: props.x,
        y: props.y,
        z: props.z,
        rx: props.rx === undefined ? plane.rotation.x : props.rx * (Math.PI / 180),
        ry: props.ry === undefined ? plane.rotation.y : props.ry * (Math.PI / 180),
        rz: props.rz === undefined ? plane.rotation.z : props.rz * (Math.PI / 180),
        sx: props.sx === undefined ? plane.scale.x : props.sx,
        sy: props.sy === undefined ? plane.scale.y : props.sy,
        onUpdate: function (pln, pnt) {
          pln.position.set(pnt.x, pnt.y, pnt.z)
          pln.rotation.set(pnt.rx, pnt.ry, pnt.rz)
          pln.scale.set(pnt.sx, pnt.sy, 1)
        },
        onUpdateParams: [plane, planePoint],
        onComplete: function (index) {
          if (onMoveComplete !== undefined && index === self.$data.planes.length - 1) {
            onMoveComplete()
          }
        },
        onCompleteParams: [completeIndex]
      })
    },
    getUserGroups: function () {
      var self = this
      var ug = {}
      for (var i = 0; i < self.filteredAwards.length; i++) {
        // if (ug['user' + self.filteredAwards[i].user_id.toString()] === undefined) {
        //   ug['user' + self.filteredAwards[i].user_id.toString()] = []
        // }
        // ug['user' + self.filteredAwards[i].user_id.toString()].push({index: i, award: self.filteredAwards[i]})
        var gt = self.getUserByID(self.filteredAwards[i].user_id).gamertag
        if (ug[gt] === undefined) {
          ug[gt] = []
        }
        ug[gt].push({index: i, award: self.filteredAwards[i]})
      }
      return ug
    },
    getAchiementGroups: function () {
      var self = this
      var ag = []
      for (var i = 0; i < self.filteredAwards.length; i++) {
        if (ag[Number(self.filteredAwards[i].ach_id)] === undefined) {
          ag[Number(self.filteredAwards[i].ach_id)] = []
        }
        ag[Number(self.filteredAwards[i].ach_id)].push({index: i, award: self.filteredAwards[i]})
      }
      return ag
    },
    getDateGroups: function () {
      var self = this
      var dg = {}
      for (var i = 0; i < self.filteredAwards.length; i++) {
        if (dg[self.filteredAwards[i].achievement_date.split(' ')[0]] === undefined) {
          dg[self.filteredAwards[i].achievement_date.split(' ')[0]] = []
        }
        dg[self.filteredAwards[i].achievement_date.split(' ')[0]].push({index: i, award: self.filteredAwards[i]})
      }
      return dg
    },
    applyUserFilter: function (award) {
      var self = this
      // var shouldShow = true
      var shouldShow = true
      for (var f in self.$data.userFilters) {
        // console.log(self.$data.userFilters[f].currentValues)
        var user = self.getUserByID(award.user_id)
        if (self.$data.userFilters[f].exclusive) {
          // if (self.$data.userFilters[f].currentValue !== -1 && user[self.$data.userFilters[f].property] !== self.$data.userFilters[f].currentValue) {
          //   shouldShow = false
          // }
          if (!self.arrayCheck(self.$data.userFilters[f].currentValues, user[self.$data.userFilters[f].property])) {
            shouldShow = false
          }
        } else {
          // if (self.$data.userFilters[f].currentValue !== -1 && !user[self.$data.userFilters[f].property].includes(self.$data.userFilters[f].currentValue)) {
          //   shouldShow = false
          // }
          var matchCount = 0
          for (var i = 0; i < user[self.$data.userFilters[f].property].length; i++) {
            if (self.arrayCheck(self.$data.userFilters[f].currentValues, user[self.$data.userFilters[f].property][i])) {
              matchCount++
              // shouldShow = false
            }
          }
          if (matchCount === 0) {
            shouldShow = false
          }
        }
      }
      return shouldShow
    }
  },
  computed: {
    hexParam: function () {
      var self = this
      var sides = 6
      var deg = 360
      var param = 'M '
      for (var i = 0; i < sides; i++) {
        var prefix = i === 0 ? '' : ' L '
        var xVal = getOrbit(0, self.$data.baseProps.size, (deg / sides) * i, 'cos')
        var yVal = getOrbit(0, self.$data.baseProps.size, (deg / sides) * i, 'sin')
        param += prefix + xVal.toString() + ' ' + yVal.toString()
      }
      param += 'Z'
      return param
    },
    filteredAwards: function () {
      var self = this
      return self.$data.awards
    },
    isIE: function () {
      var ua = navigator.userAgent
      var isie = ua.indexOf('MSIE ') > -1 || ua.indexOf('Trident/') > -1
      return isie
    },
    usersWithAwards: function () {
      var self = this
      var uList = []
      for (var i = 0; i < self.$data.users.length; i++) {
        var awardCount = 0
        for (var j = 0; j < self.$data.awards.length; j++) {
          if (self.$data.awards[j].user_id === self.$data.users[i].id) {
            awardCount++
          }
        }
        if (awardCount > 0) {
          uList.push(self.$data.users[i])
        }
      }
      return uList
    }
  },
  mounted: function () {
    var self = this
    self.getAllAwards()
    for (var m in self.$data.modes) {
      self.$data.modeStates[self.$data.modes[m]] = {o: 0}
    }
    EventBus.$on('show-detail-view', (n) => {
      var i = 0
      var relevantAwards = []
      self.$data.detailKey = n.key
      var awardList = self.filteredAwards
      // console.log(self.$data.achievements)
      // var keyProp = ''
      switch (self.$data.mode) {
        case FILTERMODES.USER:
        {
          for (i = 0; i < awardList.length; i++) {
            if (self.getUserByID(awardList[i].user_id).gamertag === n.key) {
              relevantAwards.push(awardList[i])
            }
          }
          break
        }
        case FILTERMODES.ACHIEVEMENT:
        {
          for (i = 0; i < awardList.length; i++) {
            var achId = -1
            for (var j = 0; j < self.$data.achievements.length; j++) {
              if (self.$data.achievements[j].name === n.key) {
                achId = self.$data.achievements[j].id
              }
            }
            if (awardList[i].ach_id === achId) {
              relevantAwards.push(awardList[i])
            }
          }
          break
        }
        case FILTERMODES.DATE:
        {
          for (i = 0; i < awardList.length; i++) {
            if (awardList[i].achievement_date.split(' ')[0] === n.key) {
              relevantAwards.push(awardList[i])
            }
          }
          break
        }
      }
      self.$data.detailList = relevantAwards
      self.$data.showDetail = true
      // console.log(self.$data.detailList)
    })
    EventBus.$on('on-detail-close', (n) => {
      self.$data.showDetail = false
    })
    // threejscode starts here----------------------------------
    /*
    // */
  }
}
</script>

<style lang="scss">

div.pie-break-down{
  width:70%;
  height: 250px;
  > div{
    width:100%;
    height: 100%;
    > div:first-child{
      width:100%;
      height: 100% !important;
      > canvas{
        height: 100% !important;
      }
    }
  }
}

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  width: 100%;
  

}

h1, h2 {
  font-weight: normal;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

a {
  color: #42b983;
}




#app, body, html {
  background-color: #00f0f0;
}

svg {
  /*
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  position: fixed;
  width:100%;
  height: 100%;
  
  margin:0 auto;
  width:1000px;
  height: 800px;
  max-width: 100%;
  */
}
.oversized-element{
  width: 2000px;
  height: 1000px;
  position: fixed;
  left: 50%;
  top: 50%;
  margin-left:-1000px;
  margin-top:-500px;
}


.user-interface{
  position: relative;
  z-index: 10;
  div.ui-icons{
    position: fixed;
    left: 0px;
    width: 50px;
    background-color:rgba(255,255,255,.7);
    top:40px;
    bottom:0;
    label.mode-selection{
      text-align: center;
      margin:0;
      padding:0;
      font-size: 20px;
      font-weight: bold;
      display: inline-block;
      width:100%;
      height:50px;
      background-position: center;
      background-size: 40px 40px;
      background-repeat: no-repeat;
      > input{
        display: none;
      }
    }
    label.mode-selection.selected{
      box-shadow: 3px 0 0 #ff6a3d inset;
    }
  }
  div.ui-icons.open{
    left: 200px;
  }
}
div.filter-container{
  display:block;
  width:200px;
  overflow-y: auto;
  position: fixed;
  left:0;
  top: 40px;
  bottom: 0;
  background-color: rgba(132,46,171,.7);
  div.filter-selector{
    width:100%;
    text-align: left;
    
    > label {
      text-align: left;
      background-color: rgba(132,46,171,1);
      // width:100%;
      color: #eeeeee;
      display:block;
      padding: 4px 5px;
      font-size: 12px;
      margin-bottom:1px;
    }
    > div{
      text-align: left;
      display:none;
      > label{
        display:block;
        padding: 6px;
        text-align: left;
        box-shadow: 0 -1px 0 rgba(255,255,255,.3) inset;
        color: #ffffff;
        font-size: 11px;
        > input{
          float: right;
          margin:0;
          padding:0;
        }
      }
    }
    >input{
      display:none;
    }
    > input:checked + div{
      display: block;
    }
    
  }
  
}

div.app-header{
  position:fixed;
  top:0;
  left:0;
  right:0;
  height:40px;
  background-color:#333333;
  color:rgba(255,255,255,.6);
  font-weight: bold;
  > span{
    display:inline-block;
    font-size: 20px;
    padding:8px;
    font-weight: bold;
    float:left;
  }
  > button{
    float:right;
    height:100%;
  }
}
div.autoplay-message
{
  position:fixed;
  top:50%;
  left:50%;
  height:50px;
  width:700px;
  margin-top:-25px;
  margin-left:-350px;
  border-radius: 100px;
  background-color:rgba(255,255,255,.8);
  box-shadow: 0 0 0 2px rgba(132,46,171,1);
  > span{
    display: block;
    padding:10px;
    font-size: 25px;
    font-weight: bold;
    text-transform: uppercase;
  }

}
div.autoplay-message-hidden{
  display:none;
}

</style>
