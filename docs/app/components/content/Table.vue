<template>
  <div :class="['overflow-x-auto', wrapperClass]">
    <table class="w-full text-left text-sm border-collapse" :class="tableClass">
      <thead class="border-b border-border">
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            :class="[
              'px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-muted',
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
          class="border-b border-border-subtle last:border-b-0 hover:bg-surface-muted/60 transition-colors"
        >
          <td v-for="col in columns" :key="col.key" class="px-4 py-3 align-top">
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
/**
 * Table — hairline dividers, one header rule, no filled header band. It is the
 * component counterpart of the markdown tables the typography plugin renders in
 * docs content, so a generated page reads exactly like a written one.
 */
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
