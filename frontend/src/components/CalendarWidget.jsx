import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Calendar as CalendarIcon } from 'lucide-react';

function CalendarWidget() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState(() => {
        const savedEvents = localStorage.getItem('calendar_events');
        return savedEvents ? JSON.parse(savedEvents) : [];
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newEvent, setNewEvent] = useState({ title: '', date: '' });
    const [editingId, setEditingId] = useState(null);

    // Save to local storage
    useEffect(() => {
        localStorage.setItem('calendar_events', JSON.stringify(events));
    }, [events]);

    // Calendar Logic
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month, 1).getDay();
    };

    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleAddEvent = (e) => {
        e.preventDefault();
        if (!newEvent.title || !newEvent.date) return;

        if (editingId) {
            setEvents(events.map(ev => ev.id === editingId ? { ...ev, ...newEvent } : ev));
            setEditingId(null);
        } else {
            setEvents([...events, { id: Date.now(), ...newEvent }]);
        }

        setNewEvent({ title: '', date: '' });
        setIsModalOpen(false);
    };

    const handleDeleteEvent = () => {
        if (editingId) {
            setEvents(events.filter(ev => ev.id !== editingId));
            setEditingId(null);
            setNewEvent({ title: '', date: '' });
            setIsModalOpen(false);
        }
    };

    const getEventForDate = (day) => {
        const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return events.find(event => event.date === dateString);
    };

    const handleDateClick = (day) => {
        const event = getEventForDate(day);
        if (event) {
            setNewEvent({ title: event.title, date: event.date });
            setEditingId(event.id);
            setIsModalOpen(true);
        }
    };

    return (
        <div className="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-3xl p-6 shadow-xl h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Schedule</h2>
            </div>

            {/* Calendar Header */}
            <div className="flex justify-between items-center mb-4 text-gray-300">
                <button onClick={prevMonth} className="p-1 hover:text-white transition-colors">
                    <ChevronLeft size={20} />
                </button>
                <span className="font-medium">
                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={nextMonth} className="p-1 hover:text-white transition-colors">
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 flex-1 text-center mb-4">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                    <div key={day} className="text-xs font-medium text-gray-500 py-1">
                        {day}
                    </div>
                ))}

                {/* Empty slots for start of month */}
                {Array.from({ length: firstDay }).map((_, index) => (
                    <div key={`empty-${index}`} />
                ))}

                {/* Days */}
                {Array.from({ length: daysInMonth }).map((_, index) => {
                    const day = index + 1;
                    const event = getEventForDate(day);
                    const isToday =
                        day === new Date().getDate() &&
                        currentDate.getMonth() === new Date().getMonth() &&
                        currentDate.getFullYear() === new Date().getFullYear();

                    return (
                        <div key={day} className="flex items-center justify-center aspect-square relative">
                            <button
                                onClick={() => handleDateClick(day)}
                                className={`w-8 h-8 flex items-center justify-center rounded-full text-sm transition-all
                                    ${isToday ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/30' :
                                        event ? 'bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30 hover:bg-blue-500/30' :
                                            'text-gray-300 hover:bg-gray-800 cursor-pointer'}
                                `}
                            >
                                {day}
                                {event && !isToday && (
                                    <span className="absolute bottom-1 w-1 h-1 bg-blue-400 rounded-full"></span>
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Add Event Button */}
            <button
                onClick={() => {
                    setNewEvent({ title: '', date: '' });
                    setEditingId(null);
                    setIsModalOpen(true);
                }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 mt-auto"
            >
                <Plus size={18} />
                Add Event
            </button>

            {/* Add Event Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 w-full max-w-md shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                                {editingId ? 'Edit Event' : 'Add New Event'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleAddEvent} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Event Name</label>
                                <input
                                    type="text"
                                    value={newEvent.title}
                                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                    placeholder="e.g. Interview with Google"
                                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-600"
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Date</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={newEvent.date}
                                        onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                                        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all [color-scheme:dark]"
                                    />
                                    <CalendarIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={18} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={handleDeleteEvent}
                                        className="col-span-2 px-4 py-3 rounded-xl bg-red-500/10 text-red-400 font-medium hover:bg-red-500/20 hover:text-red-300 transition-colors border border-red-500/20"
                                    >
                                        Delete Event
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-3 rounded-xl bg-gray-800 text-gray-300 font-medium hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!newEvent.title || !newEvent.date}
                                    className="px-4 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                                >
                                    {editingId ? 'Update' : 'Add Event'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div >
            )
            }
        </div >
    );
}

export default CalendarWidget;
