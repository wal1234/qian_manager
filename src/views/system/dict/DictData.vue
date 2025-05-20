<template>
  <div class="dict-data-container">
    <div class="dict-data-header">
      <div class="dict-data-info">
        <span class="dict-data-title">{{ dictType }}</span>
      </div>
      <div class="dict-data-actions">
        <el-button type="primary" @click="handleAdd" plain>
          <el-icon><Plus /></el-icon>新增
        </el-button>
        <el-button @click="handleRefresh" plain>
          <el-icon><Refresh /></el-icon>刷新
        </el-button>
      </div>
    </div>

    <!-- 字典数据列表 -->
    <el-table
      :data="dataList"
      border
      ref="dataTableRef"
      v-loading="loading"
      highlight-current-row
    >
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column prop="dictCode" label="字典编码" width="100" />
      <el-table-column prop="dictLabel" label="字典标签" :show-overflow-tooltip="true" />
      <el-table-column prop="dictValue" label="字典键值" :show-overflow-tooltip="true" />
      <el-table-column prop="dictSort" label="字典排序" width="100" align="center" />
      <el-table-column prop="status" label="状态" align="center" width="80">
        <template #default="{ row }">
          <el-tag v-if="row.status === '0'" type="success">正常</el-tag>
          <el-tag v-else type="danger">停用</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="cssClass" label="样式属性" :show-overflow-tooltip="true" />
      <el-table-column prop="listClass" label="回显样式" :show-overflow-tooltip="true">
        <template #default="{ row }">
          <el-tag v-if="row.listClass" :type="row.listClass">{{ row.dictLabel }}</el-tag>
          <span v-else>{{ row.dictLabel }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="isDefault" label="是否默认" align="center" width="80">
        <template #default="{ row }">
          <el-tag v-if="row.isDefault === 'Y'" type="success">是</el-tag>
          <el-tag v-else type="info">否</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="160" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="150">
        <template #default="{ row }">
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

    <!-- 添加或修改字典数据对话框 -->
    <el-dialog
      :title="dialog.title"
      v-model="dialog.visible"
      width="600px"
      append-to-body
    >
      <el-form
        ref="dataFormRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="字典类型">
          <el-input v-model="form.dictType" disabled />
        </el-form-item>
        <el-form-item label="数据标签" prop="dictLabel">
          <el-input v-model="form.dictLabel" placeholder="请输入数据标签" />
        </el-form-item>
        <el-form-item label="数据键值" prop="dictValue">
          <el-input v-model="form.dictValue" placeholder="请输入数据键值" />
        </el-form-item>
        <el-form-item label="显示排序" prop="dictSort">
          <el-input-number v-model="form.dictSort" :min="0" :max="999" controls-position="right" />
        </el-form-item>
        <el-form-item label="样式属性" prop="cssClass">
          <el-input v-model="form.cssClass" placeholder="请输入样式属性" />
        </el-form-item>
        <el-form-item label="回显样式" prop="listClass">
          <el-select v-model="form.listClass" placeholder="请选择回显样式">
            <el-option label="默认" value="" />
            <el-option label="主要" value="primary" />
            <el-option label="成功" value="success" />
            <el-option label="信息" value="info" />
            <el-option label="警告" value="warning" />
            <el-option label="危险" value="danger" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否默认" prop="isDefault">
          <el-radio-group v-model="form.isDefault">
            <el-radio label="Y">是</el-radio>
            <el-radio label="N">否</el-radio>
          </el-radio-group>
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
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Edit, Delete, Refresh } from '@element-plus/icons-vue'

// 定义Props
const props = defineProps({
  dictId: {
    type: [Number, String],
    required: true
  },
  dictType: {
    type: String,
    required: true
  }
})

// 查询参数
const queryParams = ref({
  dictType: props.dictType,
  pageNum: 1,
  pageSize: 10
})

// 表格数据
const dataList = ref<any[]>([])
const loading = ref(false)
const total = ref(0)
const dataTableRef = ref()
const dataFormRef = ref()

// 弹窗状态
const dialog = reactive({
  visible: false,
  title: ''
})

// 表单对象
const form = ref<any>({
  dictCode: undefined,
  dictType: props.dictType,
  dictLabel: '',
  dictValue: '',
  dictSort: 0,
  cssClass: '',
  listClass: '',
  isDefault: 'N',
  status: '0',
  remark: ''
})

// 表单校验规则
const rules = {
  dictLabel: [{ required: true, message: '数据标签不能为空', trigger: 'blur' }],
  dictValue: [{ required: true, message: '数据键值不能为空', trigger: 'blur' }],
  dictSort: [{ required: true, message: '数据顺序不能为空', trigger: 'blur' }]
}

// 监听dictType变化
watch(() => props.dictType, (val) => {
  queryParams.value.dictType = val
  handleQuery()
})

// 查询字典数据
const handleQuery = () => {
  if (!props.dictType) return

  loading.value = true
  // 模拟API调用
  setTimeout(() => {
    // 这里应该是实际API调用获取字典数据列表
    if (props.dictType === 'sys_user_sex') {
      dataList.value = [
        {
          dictCode: 1,
          dictType: 'sys_user_sex',
          dictLabel: '男',
          dictValue: '0',
          dictSort: 1,
          cssClass: '',
          listClass: 'primary',
          isDefault: 'Y',
          status: '0',
          createTime: '2023-01-01 00:00:00',
          remark: '性别男'
        },
        {
          dictCode: 2,
          dictType: 'sys_user_sex',
          dictLabel: '女',
          dictValue: '1',
          dictSort: 2,
          cssClass: '',
          listClass: 'success',
          isDefault: 'N',
          status: '0',
          createTime: '2023-01-01 00:00:00',
          remark: '性别女'
        },
        {
          dictCode: 3,
          dictType: 'sys_user_sex',
          dictLabel: '未知',
          dictValue: '2',
          dictSort: 3,
          cssClass: '',
          listClass: 'info',
          isDefault: 'N',
          status: '0',
          createTime: '2023-01-01 00:00:00',
          remark: '性别未知'
        }
      ]
    } else if (props.dictType === 'sys_show_hide') {
      dataList.value = [
        {
          dictCode: 4,
          dictType: 'sys_show_hide',
          dictLabel: '显示',
          dictValue: '0',
          dictSort: 1,
          cssClass: '',
          listClass: 'success',
          isDefault: 'Y',
          status: '0',
          createTime: '2023-01-01 00:00:00',
          remark: '显示菜单'
        },
        {
          dictCode: 5,
          dictType: 'sys_show_hide',
          dictLabel: '隐藏',
          dictValue: '1',
          dictSort: 2,
          cssClass: '',
          listClass: 'danger',
          isDefault: 'N',
          status: '0',
          createTime: '2023-01-01 00:00:00',
          remark: '隐藏菜单'
        }
      ]
    } else {
      dataList.value = [
        {
          dictCode: 6,
          dictType: 'sys_normal_disable',
          dictLabel: '正常',
          dictValue: '0',
          dictSort: 1,
          cssClass: '',
          listClass: 'success',
          isDefault: 'Y',
          status: '0',
          createTime: '2023-01-01 00:00:00',
          remark: '系统正常状态'
        },
        {
          dictCode: 7,
          dictType: 'sys_normal_disable',
          dictLabel: '停用',
          dictValue: '1',
          dictSort: 2,
          cssClass: '',
          listClass: 'danger',
          isDefault: 'N',
          status: '0',
          createTime: '2023-01-01 00:00:00',
          remark: '系统停用状态'
        }
      ]
    }
    total.value = dataList.value.length
    loading.value = false
  }, 500)
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
  dialog.title = '添加字典数据'
  form.value = {
    dictCode: undefined,
    dictType: props.dictType,
    dictLabel: '',
    dictValue: '',
    dictSort: 0,
    cssClass: '',
    listClass: '',
    isDefault: 'N',
    status: '0',
    remark: ''
  }
}

// 修改按钮操作
const handleUpdate = (row: any) => {
  dialog.visible = true
  dialog.title = '修改字典数据'
  form.value = JSON.parse(JSON.stringify(row))
}

// 删除按钮操作
const handleDelete = (row: any) => {
  ElMessageBox.confirm(
    `是否确认删除字典标签为"${row.dictLabel}"的数据项?`,
    '警告',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 这里应该是实际API调用删除字典数据
    ElMessage.success('删除成功')
    handleQuery()
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 提交表单
const submitForm = () => {
  dataFormRef.value?.validate((valid: boolean) => {
    if (valid) {
      // 这里应该是实际API调用保存字典数据
      ElMessage.success(form.value.dictCode ? '修改成功' : '新增成功')
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
.dict-data-container {
  padding: 10px;
}

.dict-data-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.dict-data-title {
  font-size: 16px;
  font-weight: bold;
}

.dialog-footer {
  text-align: right;
}
</style> 