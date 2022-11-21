<template>
    <v-row>
        <v-col
        cols="12"
        sm="12"
        >
            <v-file-input
                v-model="files"
                color="deep-purple accent-4"
                counter
                label="Выберите файл Excel"
                multiple
                placeholder="Импорт"
                prepend-icon="mdi-paperclip"
                outlined
                :show-size="1000"
                :accept="accepts.join(', ')"
            >
                <template v-slot:selection="{ index, text }">
                <v-chip
                    v-if="index < 2"
                    color="deep-purple accent-4"
                    dark
                    label
                    small
                >
                    {{ text }}
                </v-chip>

                <span
                    v-else-if="index === 2"
                    class="text-overline grey--text text--darken-3 mx-2"
                >
                    +{{ files.length - 2 }} File(s)
                </span>
                </template>
            </v-file-input>
        </v-col>
        <v-col
        cols="12"
        sm="3"
        v-if="files.length > 0"
        >
        <div class="preloader" v-if="loadingData">
            <div class="lds-ring"><div></div><div></div><div></div><div></div></div>
        </div>
        <div v-else>
        <h3 class="mb-3">Заголовки</h3>
            <draggable
                class="list-group"
                tag="ul"
                v-model="list"
                v-bind="dragOptions"
                @start="drag = true"
                @end="drag = false"
            >
                <transition-group type="transition" :name="!drag ? 'flip-list' : null">
                <li
                    class="list-group-item"
                    v-for="element in list"
                    :key="element.name"
                >
                    <i
                    :class="
                        element.fixed ? 'fa fa-anchor' : 'glyphicon glyphicon-pushpin'
                    "
                    @click="element.fixed = !element.fixed"
                    aria-hidden="true"
                    ></i>
                    {{ element.name }}
                </li>
                </transition-group>
            </draggable>
        </div>
        </v-col>
        <v-col
            cols="12"
            sm="3"
            v-for="field in fieldsSystem"
            :key="field.tag"
        >
        <h3 class="mb-3">{{ field.name }}</h3>
        <draggable
            class="list-group"
            tag="ul"
            v-model="field.item"
            v-bind="dragOptions"
            @start="drag = true"
            @end="drag = false"
        >
            <transition-group type="transition" :name="!drag ? 'flip-list' : null">
            <li
                class="list-group-item"
                v-for="element in field.item"
                :key="field.tag"
            >
                <i
                :class="
                    element.fixed ? 'fa fa-anchor' : 'glyphicon glyphicon-pushpin'
                "
                aria-hidden="true"
                ></i>
                {{ element.name }}
            </li>
            </transition-group>
        </draggable>
        </v-col>
    </v-row>
</template>

<script>
const serverSetting = require('../server/config/serverSetting.json')
const { v4: uuidv4 } = require('uuid')

import draggable from 'vuedraggable'

export default {
    name: "PageUploads",
    data: () => ({
        accepts: [
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.template",
            "application/vnd.ms-excel.sheet.macroEnabled.12",
            "application/vnd.ms-excel.template.macroEnabled.12",
            "application/vnd.ms-excel.addin.macroEnabled.12",
            "application/vnd.ms-excel.sheet.binary.macroEnabled.12",
        ],
        files: [],
        list: [],
        fieldsSystem: [],
        drag: false,
        loadingData: false,
    }),
    methods: {

    },
    components: {draggable},
    computed: {
        dragOptions() {
            return {
                animation: 200,
                group: "description",
                disabled: false,
                ghostClass: "ghost"
            };
        }
    },
    watch: {
        async files() {
            if(this.files.length) {
                this.loadingData = true

                let formData = new FormData()

                formData.append('uniqueSuffix', uuidv4())
                formData.append('xlxsFile', this.files[0], this.files[0].name)

                const data = await fetch(`${serverSetting.baseUrl}:${serverSetting.port}/getHeadFieldsExcel`, {
                    method: "POST",
                    headers: {
                        // 'Content-Type': 'multipart/form-data;boundary=MyBoundary'
                        // 'Content-Type': 'application/json;charset=utf-8'
                    },
                    body: formData
                })

                const result = await data.json()
                
                result.heading.forEach(head => {
                    this.list.push({
                        name: head
                    })
                })

                result.fieldsValues.forEach((field, index) => {
                    this.fieldsSystem.push({
                        item: [],
                        name: field.name,
                        tag: field.tag,
                        idInfo: field.idInfo
                    })
                })

                this.loadingData = false
            } else {
                this.list = []
                this.fieldsSystem = []
            }
        }
    },
    async beforeMount() {},
}
</script>

<style scoped>
.lds-ring {
  display: inline-block;
  position: relative;
  width: 80px;
  height: 80px;
}
.lds-ring div {
  box-sizing: border-box;
  display: block;
  position: absolute;
  width: 64px;
  height: 64px;
  margin: 8px;
  border: 8px solid #000;
  border-radius: 50%;
  animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  border-color: #000 transparent transparent transparent;
}
.lds-ring div:nth-child(1) {
  animation-delay: -0.45s;
}
.lds-ring div:nth-child(2) {
  animation-delay: -0.3s;
}
.lds-ring div:nth-child(3) {
  animation-delay: -0.15s;
}
@keyframes lds-ring {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
ul {
    list-style-type: none;
    padding: 0;
    min-height: 40px;
}
ul span {
    min-height: 40px;
    width: 100%;
    display: inline-block;
}
ul li {
    padding: 7px 5px;
    border: 1px solid #ccc;
    border-radius: 6px;
}
ul li:not(:last-child) {
    margin-bottom: 10px;
}
.list-group-item {
  cursor: move;
}
.list-group-item i {
  cursor: pointer;
}
</style>