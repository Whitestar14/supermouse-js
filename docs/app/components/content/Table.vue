<template>
  <div :class="['overflow-x-auto code-scroll', wrapperClass]" data-lenis-prevent>
    <table class="w-full text-left text-sm border-collapse" :class="tableClass">
      <thead>
        <tr class="border-b border-border">
          <th
            v-for="col in columns"
            :key="col.key"
            :class="[
              'px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-muted align-bottom',
              col.class
            ]"
          >
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, rowIndex) in rows"
          :key="rowKey ? (row[rowKey] ?? rowIndex) : rowIndex"
          class="border-b border-border-subtle last:border-b-0 transition-colors hover:bg-surface-muted/60"
        >
          <td v-for="col in columns" :key="col.key" class="px-4 py-3.5 align-top">
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
/** Component counterpart of the markdown table shell (`ProseTable.vue`). */
export interface TableColumn {
  key: string;
  label: string;
  class?: string;
}

defineProps<{
  columns: TableColumn[];
  rows: Record<string, any>[];
  rowKey?: string;
  wrapperClass?: string;
  tableClass?: string;
}>();
</script>
