<template>
  <div class="dict-list-container">
    <div class="dict-header">
      <h2>字典管理</h2>
      <div class="dict-actions">
        <el-button type="primary" @click="handleAdd" plain>
          <el-icon><Plus /></el-icon>新增
        </el-button>
        <el-button @click="handleRefresh" plain>
          <el-icon><Refresh /></el-icon>刷新
        </el-button>
      </div>
    </div>

    <el-card shadow="hover" class="dict-card">
      <!-- 搜索表单 -->
      <el-form :model="queryParams" ref="queryFormRef" :inline="true" class="dict-search-form">
        <el-form-item label="字典名称" prop="dictName">
          <el-input v-model="queryParams.dictName" placeholder="请输入字典名称" clearable />
        </el-form-item>
        <el-form-item label="字典类型" prop="dictType">
          <el-input v-model="queryParams.dictType" placeholder="请输入字典类型" clearable />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="字典状态" clearable>
            <el-option label="正常" value="0" />
            <el-option label="停用" value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">
            <el-icon><Search /></el-icon>搜索
          </el-button>
          <el-button @click="resetQuery">
            <el-icon><Refresh /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 字典列表 -->
      <el-table
        :data="dictList"
        border
        ref="dictTableRef"
        v-loading="loading"
        highlight-current-row
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column prop="dictId" label="字典编号" width="100" />
        <el-table-column prop="dictName" label="字典名称" :show-overflow-tooltip="true" />
        <el-table-column prop="dictType" label="字典类型" :show-overflow-tooltip="true" />
        <el-table-column prop="status" label="状态" align="center" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.status === '0'" type="success">正常</el-tag>
            <el-tag v-else type="danger">停用</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createTime" width="160" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="260">
          <template #default="{ row }">
            <el-button
              type="success"
              link
              :icon="View"
              @click="handleDict(row)"
            >
              字典数据
            </el-button>
            <el-button
              type="primary"
              link
              :icon="Edit"
              @click="handleUpdate(row)"
            >
              修改
            </el-button>
            <el-button
              type="danger"
              link
              :icon="Delete"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页组件 -->
      <el-pagination
        v-model:current-page="queryParams.pageNum"
        v-model:page-size="queryParams.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </el-card>

    <!-- 添加或修改字典类型对话框 -->
    <el-dialog
      :title="dialog.title"
      v-model="dialog.visible"
      width="600px"
      append-to-body
    >
      <el-form
        ref="dictFormRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="字典名称" prop="dictName">
          <el-input v-model="form.dictName" placeholder="请输入字典名称" />
        </el-form-item>
        <el-form-item label="字典类型" prop="dictType">
          <el-input v-model="form.dictType" placeholder="请输入字典类型" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio label="0">正常</el-radio>
            <el-radio label="1">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialog.visible = false">取 消</el-button>
          <el-button type="primary" @click="submitForm">确 定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 字典数据对话框 -->
    <el-dialog
      title="字典数据"
      v-model="dictDataDialog.visible"
      width="800px"
      append-to-body
    >
      <DictData :dict-id="dictDataDialog.dictId" :dict-type="dictDataDialog.dictType" />
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Edit, Delete, Refresh, View } from '@element-plus/icons-vue'
import DictData from './DictData.vue'

// 查询参数
const queryParams = ref({
  dictName: '',
  dictType: '',
  status: '',
  pageNum: 1,
  pageSize: 10
})

// 表格数据
const dictList = ref<any[]>([])
const loading = ref(false)
const total = ref(0)
const dictTableRef = ref()
const queryFormRef = ref()
const dictFormRef = ref()

// 弹窗状态
const dialog = reactive({
  visible: false,
  title: ''
})

// 字典数据弹窗状态
const dictDataDialog = reactive({
  visible: false,
  dictId: '',
  dictType: ''
})

// 表单对象
const form = ref<any>({
  dictId: undefined,
  dictName: '',
  dictType: '',
  status: '0',
  remark: ''
})

// 表单校验规则
const rules = {
  dictName: [{ required: true, message: '字典名称不能为空', trigger: 'blur' }],
  dictType: [{ required: true, message: '字典类型不能为空', trigger: 'blur' }]
}

// 查询字典数据
const handleQuery = () => {
  loading.value = true
  // 模拟API调用
  setTimeout(() => {
    // 这里应该是实际API调用获取字典类型列表
    dictList.value = [
      {
        dictId: 1,
        dictName: '用户性别',
        dictType: 'sys_user_sex',
        status: '0',
        createTime: '2023-01-01 00:00:00',
        remark: '用户性别列表'
      },
      {
        dictId: 2,
        dictName: '菜单状态',
        dictType: 'sys_show_hide',
        status: '0',
        createTime: '2023-01-01 00:00:00',
        remark: '菜单状态列表'
      },
      {
        dictId: 3,
        dictName: '系统开关',
        dictType: 'sys_normal_disable',
        status: '0',
        createTime: '2023-01-01 00:00:00',
        remark: '系统开关列表'
      }
    ]
    total.value = dictList.value.length
    loading.value = false
  }, 500)
}

// 重置查询
const resetQuery = () => {
  queryFormRef.value?.resetFields()
  queryParams.value.pageNum = 1
  handleQuery()
}

// 刷新列表
const handleRefresh = () => {
  handleQuery()
}

// 分页大小改变
const handleSizeChange = (size: number) => {
  queryParams.value.pageSize = size
  handleQuery()
}

// 分页页码改变
const handleCurrentChange = (page: number) => {
  queryParams.value.pageNum = page
  handleQuery()
}

// 新增按钮操作
const handleAdd = () => {
  dialog.visible = true
  dialog.title = '添加字典类型'
  form.value = {
    dictId: undefined,
    dictName: '',
    dictType: '',
    status: '0',
    remark: ''
  }
}

// 修改按钮操作
const handleUpdate = (row: any) => {
  dialog.visible = true
  dialog.title = '修改字典类型'
  form.value = JSON.parse(JSON.stringify(row))
}

// 查看字典数据
const handleDict = (row: any) => {
  dictDataDialog.visible = true
  dictDataDialog.dictId = row.dictId
  dictDataDialog.dictType = row.dictType
}

// 删除按钮操作
const handleDelete = (row: any) => {
  ElMessageBox.confirm(
    `是否确认删除字典名称为"${row.dictName}"的数据项?`,
    '警告',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 这里应该是实际API调用删除字典类型
    ElMessage.success('删除成功')
    handleQuery()
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 提交表单
const submitForm = () => {
  dictFormRef.value?.validate((valid: boolean) => {
    if (valid) {
      // 这里应该是实际API调用保存字典类型
      ElMessage.success(form.value.dictId ? '修改成功' : '新增成功')
      dialog.visible = false
      handleQuery()
    }
  })
}

// 页面初始化
onMounted(() => {
  handleQuery()
})
</script>

<style scoped>
.dict-list-container {
  padding: 20px;
}

.dict-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.dict-card {
  margin-bottom: 20px;
}

.dict-search-form {
  margin-bottom: 20px;
}

.dialog-footer {
  text-align: right;
}
</style> 