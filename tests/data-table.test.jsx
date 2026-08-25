import { describe, expect, it } from 'vitest';
import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { DataTable } from '@/components/ui/DataTable';

const ROWS = [
  { id: 'ARB-620001', name: 'Zeta', amount: 300, state: 'FL' },
  { id: 'ARB-620002', name: 'Alpha', amount: 100, state: 'TX' },
  { id: 'ARB-620003', name: 'Mid', amount: 200, state: 'CA' },
];

const COLUMNS = [
  { key: 'id', header: 'Case #' },
  { key: 'name', header: 'Name' },
  { key: 'amount', header: 'Amount', align: 'right' },
  { key: 'state', header: 'State' },
  { key: 'extra', header: 'Extra' },
  { key: 'more', header: 'More' },
  { key: 'actions', header: 'Actions', cell: () => <button type="button">Edit</button> },
];

const headers = () => [...document.querySelectorAll('.dt thead th')].map((h) => h.textContent.trim()).filter(Boolean);
const bodyCol = (i) => [...document.querySelectorAll('.dt tbody tr')].map((r) => r.querySelectorAll('td')[i]?.textContent.trim());

function Selectable() {
  const [selected, setSelected] = useState(new Set());
  return (
    <DataTable
      columns={COLUMNS}
      rows={ROWS}
      rowKey={(r) => r.id}
      selection={{
        selected,
        onToggle: (id) => setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; }),
        onToggleAll: (ids, checked) => setSelected((p) => {
          const n = new Set(p);
          ids.forEach((id) => (checked ? n.add(id) : n.delete(id)));
          return n;
        }),
      }}
    />
  );
}

describe('column placement', () => {
  it('pins Actions first even when the screen did not say so', () => {
    // Actions is declared LAST in COLUMNS and carries no `pinned` flag.
    render(<DataTable columns={COLUMNS} rows={ROWS} rowKey={(r) => r.id} />);
    expect(headers()[0]).toBe('Actions');
  });

  it('gives Actions and its cells the same left alignment', () => {
    render(<DataTable columns={COLUMNS} rows={ROWS} rowKey={(r) => r.id} />);
    const th = document.querySelector('.dt thead th');
    const td = document.querySelector('.dt tbody td');
    expect(th.style.textAlign).toBe('left');
    expect(td.style.textAlign).toBe('left');
  });

  it('agrees on alignment between every header and its cells', () => {
    // The bug this catches: a centred column whose title sat left of its values.
    render(<DataTable columns={COLUMNS} rows={ROWS} rowKey={(r) => r.id} />);
    const ths = [...document.querySelectorAll('.dt thead th')];
    const tds = [...document.querySelectorAll('.dt tbody tr')[0].querySelectorAll('td')];
    ths.forEach((th, i) => {
      if (tds[i]) expect(th.style.textAlign).toBe(tds[i].style.textAlign);
    });
  });

  it('honours an explicit right alignment, so money keeps its column', () => {
    render(<DataTable columns={COLUMNS} rows={ROWS} rowKey={(r) => r.id} />);
    const i = headers().indexOf('Amount');
    expect([...document.querySelectorAll('.dt thead th')][i].style.textAlign).toBe('right');
  });
});

describe('selection', () => {
  it('selects all, then clears on a second click', () => {
    // The header box was deriving its next state instead of reading its own,
    // which broke the indeterminate -> checked -> clear cycle.
    render(<Selectable />);
    const all = screen.getByLabelText('Select all rows');
    fireEvent.click(all);
    expect(document.querySelectorAll('.dt tbody input:checked')).toHaveLength(3);

    fireEvent.click(screen.getByLabelText('Clear selection'));
    expect(document.querySelectorAll('.dt tbody input:checked')).toHaveLength(0);
  });
});

describe('built-in tools', () => {
  it('offers search, advanced search, columns and density past the thresholds', () => {
    render(<DataTable tools columns={COLUMNS} rows={ROWS} rowKey={(r) => r.id} />);
    expect(screen.getByPlaceholderText('Search this table…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Advanced Search/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Column Toggle/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Comfortable/ })).toBeInTheDocument();
  });

  it('filters rows by the search box', () => {
    render(<DataTable tools columns={COLUMNS} rows={ROWS} rowKey={(r) => r.id} />);
    fireEvent.change(screen.getByPlaceholderText('Search this table…'), { target: { value: 'Alpha' } });
    expect(document.querySelectorAll('.dt tbody tr')).toHaveLength(1);
  });

  it('keeps the toolbar reachable when a filter matches nothing', () => {
    // Otherwise a bad filter leaves no way back to the data.
    render(<DataTable tools columns={COLUMNS} rows={ROWS} rowKey={(r) => r.id} />);
    fireEvent.change(screen.getByPlaceholderText('Search this table…'), { target: { value: 'zzzz' } });
    expect(document.querySelector('.dt__tools')).toBeInTheDocument();
    expect(screen.getByText(/Nothing matches those filters/)).toBeInTheDocument();
  });

  it('sorts a column both ways without the screen supplying a comparator', () => {
    render(<DataTable tools columns={COLUMNS} rows={ROWS} rowKey={(r) => r.id} />);
    const nameIdx = headers().indexOf('Name');
    const btn = within([...document.querySelectorAll('.dt thead th')][nameIdx]).getByRole('button');

    fireEvent.click(btn);
    expect(bodyCol(nameIdx)).toEqual(['Alpha', 'Mid', 'Zeta']);

    fireEvent.click(btn);
    expect(bodyCol(nameIdx)).toEqual(['Zeta', 'Mid', 'Alpha']);
  });

  it('sorts numbers numerically, not as strings', () => {
    const rows = [{ id: 'a', n: 9 }, { id: 'b', n: 100 }, { id: 'c', n: 20 }];
    const cols = [{ key: 'n', header: 'N' }, { key: 'id', header: 'Id' }];
    render(<DataTable tools columns={cols} rows={rows} rowKey={(r) => r.id} />);
    fireEvent.click(within([...document.querySelectorAll('.dt thead th')][0]).getByRole('button'));
    expect(bodyCol(0)).toEqual(['9', '20', '100']);
  });

  it('makes every column sortable except Actions', () => {
    render(<DataTable tools columns={COLUMNS} rows={ROWS} rowKey={(r) => r.id} />);
    const ths = [...document.querySelectorAll('.dt thead th')].filter((h) => h.textContent.trim());
    ths.forEach((th) => {
      const sortable = Boolean(th.querySelector('.dt__sort-btn'));
      expect(sortable).toBe(th.textContent.trim() !== 'Actions');
    });
  });

  it('shows a drag handle on every reorderable column and none on Actions', () => {
    render(<DataTable tools columns={COLUMNS} rows={ROWS} rowKey={(r) => r.id} />);
    const ths = [...document.querySelectorAll('.dt thead th')].filter((h) => h.textContent.trim());
    ths.forEach((th) => {
      const draggable = th.getAttribute('draggable') === 'true';
      expect(draggable).toBe(th.textContent.trim() !== 'Actions');
      expect(Boolean(th.querySelector('.dt__th-handle'))).toBe(draggable);
    });
  });

  it('hides the column picker and density toggle on a small table', () => {
    const cols = [{ key: 'id', header: 'Id' }, { key: 'name', header: 'Name' }];
    render(<DataTable tools columns={cols} rows={ROWS} rowKey={(r) => r.id} />);
    expect(screen.queryByRole('button', { name: /Column Toggle/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Comfortable/ })).toBeNull();
  });
});
