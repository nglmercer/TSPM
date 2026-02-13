import Table from 'cli-table3';
import { log } from '../../utils/logger';

export interface TableOptions {
  head: string[];
  colWidths?: number[];
  chars?: Record<string, string>;
  style?: Record<string, any>;
}

export class CliTable {
  private table: Table.Table;

  constructor(options: TableOptions) {
    this.table = new Table({
      head: options.head,
      colWidths: options.colWidths,
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

  push(...rows: any[][]): void {
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
export function printTable(head: string[], rows: any[][]): void {
  const table = new CliTable({ head });
  table.push(...rows);
  table.render();
}
