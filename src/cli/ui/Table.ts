import Table from 'cli-table3';
import { log } from '../../utils/logger';

export interface TableOptions {
  head: string[];
  colWidths?: number[];
  chars?: Record<string, string>;
  style?: Record<string, unknown>;
}

export class CliTable {
  private table: Table.Table;

  constructor(options: TableOptions) {
    // Ensure we have valid column widths
    const colWidths = options.colWidths || options.head.map(() => 30);
    
    this.table = new Table({
      head: options.head,
      colWidths: colWidths,
      chars: options.chars || {
        'top': '═', 'top-mid': '╤', 'top-left': '╔', 'top-right': '╗',
        'bottom': '═', 'bottom-mid': '╧', 'bottom-left': '╚', 'bottom-right': '╝',
        'left': '║', 'left-mid': '╟', 'mid': '─', 'mid-mid': '┼',
        'right': '║', 'right-mid': '╢', 'middle': '│'
      },
      style: options.style || {
        head: ['cyan'],
        border: ['gray'],
      }
    });
  }

  push(...rows: (string | number | boolean | null | undefined)[][]): void {
    this.table.push(...rows);
  }

  render(): void {
    log.raw(this.table.toString());
  }

  toString(): string {
    return this.table.toString();
  }
}

/**
 * Quick create and render a table
 */
export function printTable(head: string[], rows: (string | number | boolean | null | undefined)[][]): void {
  // Handle empty data case
  if (!head || head.length === 0) {
    log.info('No data to display');
    return;
  }
  
  // Calculate column widths based on content or use defaults
  const colWidths = head.map(() => 30);
  
  const table = new CliTable({ head, colWidths });
  
  // Only push rows if we have data
  if (rows && rows.length > 0) {
    table.push(...rows);
  }
  
  table.render();
}
