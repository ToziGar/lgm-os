import { Rnd } from 'react-rnd';
import { X, Minus, Square, Maximize2 } from 'lucide-react';
import { useWindowStore } from '../../store/windowStore';
import type { WindowState } from '../../types';
import './Window.css';

interface Props {
  window: WindowState;
  children: React.ReactNode;
}

export function AppWindow({ window: win, children }: Props) {
  const { closeWindow, minimizeWindow, maximizeWindow, focusWindow, moveWindow, resizeWindow } =
    useWindowStore();

  if (win.isMinimized) return null;

  const handleFocus = () => focusWindow(win.id);

  const TitleBar = (
    <div
      className={`window__titlebar ${win.isFocused ? 'window__titlebar--focused' : ''}`}
      onDoubleClick={() => maximizeWindow(win.id)}
    >
      <div className="window__titlebar-actions">
        <button
          className="window__btn window__btn--close"
          onClick={(e) => { e.stopPropagation(); closeWindow(win.id); }}
          title="Cerrar"
        >
          <X size={7} />
        </button>
        <button
          className="window__btn window__btn--min"
          onClick={(e) => { e.stopPropagation(); minimizeWindow(win.id); }}
          title="Minimizar"
        >
          <Minus size={7} />
        </button>
        <button
          className="window__btn window__btn--max"
          onClick={(e) => { e.stopPropagation(); maximizeWindow(win.id); }}
          title={win.isMaximized ? 'Restaurar' : 'Maximizar'}
        >
          {win.isMaximized ? <Square size={7} /> : <Maximize2 size={7} />}
        </button>
      </div>
      <div className="window__titlebar-left">
        <span className="window__icon">{win.icon}</span>
        <span className="window__title">{win.title}</span>
      </div>
    </div>
  );

  if (win.isMaximized) {
    return (
      <div
        className={`window window--maximized ${win.isFocused ? 'window--focused' : ''}`}
        style={{ zIndex: win.zIndex, pointerEvents: 'all' }}
        onMouseDown={handleFocus}
      >
        {TitleBar}
        <div className="window__content">{children}</div>
      </div>
    );
  }

  return (
    <Rnd
      position={{ x: win.x, y: win.y }}
      size={{ width: win.width, height: win.height }}
      minWidth={win.minWidth}
      minHeight={win.minHeight}
      bounds="#window-layer"
      dragHandleClassName="window__titlebar"
      style={{ zIndex: win.zIndex, pointerEvents: 'all' }}
      onMouseDown={handleFocus}
      onDragStop={(_, d) => moveWindow(win.id, d.x, d.y)}
      onResizeStop={(_, __, ref, ___, pos) =>
        resizeWindow(win.id, parseInt(ref.style.width), parseInt(ref.style.height), pos.x, pos.y)
      }
    >
      <div
        className={`window ${win.isFocused ? 'window--focused' : ''}`}
        style={{ width: '100%', height: '100%' }}
        onMouseDown={handleFocus}
      >
        {TitleBar}
        <div className="window__content">{children}</div>
      </div>
    </Rnd>
  );
}
