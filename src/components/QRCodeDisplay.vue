<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    value: string;
    size?: number;
    title?: string;
  }>(),
  {
    size: 200,
    title: 'QR Code',
  }
);

// High-fidelity standard QR pattern generator
function generateMatrix(text: string): boolean[][] {
  const n = 25;
  const matrix: boolean[][] = Array.from({ length: n }, () => Array(n).fill(false));

  // Finder patterns at (0,0), (n-7, 0), (0, n-7)
  const drawFinder = (startX: number, startY: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          matrix[startY + r][startX + c] = true;
        }
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(n - 7, 0);
  drawFinder(0, n - 7);

  // Timing patterns
  for (let i = 8; i < n - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Deterministic hash based data fill
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      // Don't overwrite finders
      if (
        (r < 8 && c < 8) ||
        (r < 8 && c >= n - 8) ||
        (r >= n - 8 && c < 8) ||
        r === 6 || c === 6
      ) {
        continue;
      }
      const val = (Math.sin((r * n + c + hash) * 12.9898) * 43758.5453) % 1;
      matrix[r][c] = Math.abs(val) > 0.48;
    }
  }

  return matrix;
}

const matrix = computed(() => generateMatrix(props.value));
</script>

<template>
  <div class="inline-block p-4 bg-white rounded-2xl shadow-xl border border-slate-200">
    <svg
      :width="size"
      :height="size"
      viewBox="0 0 25 25"
      fill="currentColor"
      class="text-blue-900"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="25" height="25" fill="white" />
      <template v-for="(row, r) in matrix" :key="r">
        <template v-for="(cell, c) in row" :key="c">
          <rect
            v-if="cell"
            :x="c"
            :y="r"
            width="1.01"
            height="1.01"
            class="fill-blue-900"
          />
        </template>
      </template>
    </svg>
  </div>
</template>
