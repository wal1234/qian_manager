<template>
  <div class="params-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>系统参数管理</span>
          <el-button type="primary" size="small" @click="dialogVisible = true">新增参数</el-button>
        </div>
      </template>
      
      <!-- 新增参数弹框 -->
      <el-dialog v-model="dialogVisible" title="新增系统参数" width="30%" class="system-dialog">
        <el-form :model="paramForm" label-width="80px" :rules="rules" ref="paramFormRef">
          <el-form-item label="参数名" prop="name">
            <el-input v-model="paramForm.name" placeholder="请输入参数名" />
          </el-form-item>
          <el-form-item label="参数值" prop="value">
            <el-input v-model="paramForm.value" placeholder="请输入参数值" />
          </el-form-item>
          <el-form-item label="描述" prop="desc">
            <el-input v-model="paramForm.desc" type="textarea" placeholder="请输入参数描述" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确定</el-button>
        </template>
      </el-dialog>
      
      <!-- 编辑参数弹框 -->
      <el-dialog v-model="editDialogVisible" title="编辑系统参数" width="30%" class="system-dialog">
        <el-form :model="editForm" label-width="80px" :rules="rules" ref="editFormRef">
          <el-form-item label="参数名" prop="name">
            <el-input v-model="editForm.name" placeholder="请输入参数名" disabled />
          </el-form-item>
          <el-form-item label="参数值" prop="value">
            <el-input v-model="editForm.value" placeholder="请输入参数值" />
          </el-form-item>
          <el-form-item label="描述" prop="desc">
            <el-input v-model="editForm.desc" type="textarea" placeholder="请输入参数描述" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitEditForm">确定</el-button>
        </template>
      </el-dialog>
      
      <el-table :data="paramsData" border style="width: 100%">
        <el-table-column prop="name" label="参数名" width="180" />
        <el-table-column prop="value" label="参数值" />
        <el-table-column prop="desc" label="描述" />
        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'

const paramsData = reactive([
  { name: 'site_name', value: '我的博客', desc: '网站名称' },
  { name: 'theme', value: 'dark', desc: '主题设置' }
])

const dialogVisible = ref(false)
const editDialogVisible = ref(false)
const paramFormRef = ref(null)
const editFormRef = ref(null)

const paramForm = reactive({
  name: '',
  value: '',
  desc: ''
})

const editForm = reactive({
  name: '',
  value: '',
  desc: ''
})

const rules = {
  name: [{ required: true, message: '请输入参数名', trigger: 'blur' }],
  value: [{ required: true, message: '请输入参数值', trigger: 'blur' }]
}

const handleEdit = (row) => {
  editForm.name = row.name
  editForm.value = row.value
  editForm.desc = row.desc
  editDialogVisible.value = true
}

const submitForm = () => {
  paramsData.push({
    name: paramForm.name,
    value: paramForm.value,
    desc: paramForm.desc
  })
  dialogVisible.value = false
  paramForm.name = ''
  paramForm.value = ''
  paramForm.desc = ''
}

const submitEditForm = () => {
  const index = paramsData.findIndex(item => item.name === editForm.name)
  if (index >= 0) {
    paramsData[index].value = editForm.value
    paramsData[index].desc = editForm.desc
  }
  editDialogVisible.value = false
  editForm.name = ''
  editForm.value = ''
  editForm.desc = ''
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除参数 "${row.name}" 吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(() => {
      const index = paramsData.findIndex(item => item.name === row.name)
      if (index >= 0) {
        paramsData.splice(index, 1)
        ElMessage({
          type: 'success',
          message: '删除成功',
        })
      }
    })
    .catch(() => {
      ElMessage({
        type: 'info',
        message: '已取消删除',
      })
    })
}
</script>

<style scoped>
.params-container {
  padding: 0;
  background-color: #f5f7fa;
  min-height: 100vh;
  box-sizing: border-box;
}

.el-card {
  border-radius: 0;
  border: none;
  transition: all 0.3s;
  height: 100vh;
}

.el-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.system-dialog {
  z-index: 2000 !important;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.el-table {
  margin-top: 20px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.el-table:hover {
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.15);
}
</style>