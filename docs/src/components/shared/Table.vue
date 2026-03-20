<template>
  <div :class="['overflow-x-auto', wrapperClass]">
    <table class="w-full text-left text-sm border-collapse" :class="tableClass">
      <thead class="bg-zinc-50 border-b border-zinc-200">
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            :class="['px-6 py-4 font-mono text-xs font-bold text-zinc-500 uppercase', col.class]"
          >
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-zinc-200">
        <tr
          v-for="(row, rowIndex) in rows"
          :key="rowKey ? (row[rowKey] ?? rowIndex) : rowIndex"
          class="group hover:bg-zinc-50 transition-colors"
        >
          <td v-for="col in columns" :key="col.key" class="px-6 py-5 align-top">
            <slot :name="`cell-${col.key}`" :row="row">
              {{ row[col.key] }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
export interface TableColumn {
  key: string;
  label: string;
  class?: string;
}

const props = defineProps<{
  columns: TableColumn[];
  rows: Record<string, any>[];
  rowKey?: string;
  wrapperClass?: string;
  tableClass?: string;
}>();
</script>
