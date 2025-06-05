
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Friend, BirthdayWithFriend, CreateFriendInput, CreateBirthdayInput } from '../../server/src/schema';

interface CalendarDay {
  date: Date;
  birthdays: BirthdayWithFriend[];
}

function App() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [monthBirthdays, setMonthBirthdays] = useState<BirthdayWithFriend[]>([]);
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const [isAddBirthdayOpen, setIsAddBirthdayOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [friendFormData, setFriendFormData] = useState<CreateFriendInput>({
    name: '',
    email: null,
    phone: null,
    notes: null
  });

  const [birthdayFormData, setBirthdayFormData] = useState<CreateBirthdayInput>({
    friend_id: 0,
    birth_date: new Date(),
    birth_year: null,
    reminder_days: 7,
    is_active: true
  });

  // Load friends on component mount
  const loadFriends = useCallback(async () => {
    try {
      const result = await trpc.getFriends.query();
      setFriends(result);
    } catch (error) {
      console.error('Failed to load friends:', error);
    }
  }, []);

  // Load birthdays for selected month
  const loadMonthBirthdays = useCallback(async () => {
    try {
      const result = await trpc.getBirthdaysByMonth.query({
        year: selectedYear,
        month: selectedMonth
      });
      setMonthBirthdays(result);
    } catch (error) {
      console.error('Failed to load month birthdays:', error);
    }
  }, [selectedYear, selectedMonth]);

  // Load calendar data for the year
  const loadCalendarData = useCallback(async () => {
    try {
      const result = await trpc.getCalendarData.query({
        year: selectedYear
      });
      setCalendarData(result);
    } catch (error) {
      console.error('Failed to load calendar data:', error);
    }
  }, [selectedYear]);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  useEffect(() => {
    loadMonthBirthdays();
  }, [loadMonthBirthdays]);

  useEffect(() => {
    loadCalendarData();
  }, [loadCalendarData]);

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      const newMonth = date.getMonth() + 1;
      const newYear = date.getFullYear();
      
      if (newMonth !== selectedMonth || newYear !== selectedYear) {
        setSelectedMonth(newMonth);
        setSelectedYear(newYear);
      }
    }
  };

  // Handle month change
  const handleMonthChange = (date: Date) => {
    const newMonth = date.getMonth() + 1;
    const newYear = date.getFullYear();
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  // Create friend
  const handleCreateFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createFriend.mutate(friendFormData);
      setFriends((prev: Friend[]) => [...prev, response]);
      setFriendFormData({
        name: '',
        email: null,
        phone: null,
        notes: null
      });
      setIsAddFriendOpen(false);
    } catch (error) {
      console.error('Failed to create friend:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Create birthday
  const handleCreateBirthday = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.createBirthday.mutate(birthdayFormData);
      setBirthdayFormData({
        friend_id: 0,
        birth_date: new Date(),
        birth_year: null,
        reminder_days: 7,
        is_active: true
      });
      setIsAddBirthdayOpen(false);
      // Refresh data
      loadMonthBirthdays();
      loadCalendarData();
    } catch (error) {
      console.error('Failed to create birthday:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get birthdays for a specific date
  const getBirthdaysForDate = (date: Date): BirthdayWithFriend[] => {
    const calendarDay = calendarData.find((day: CalendarDay) => 
      day.date.toDateString() === date.toDateString()
    );
    return calendarDay?.birthdays || [];
  };

  // Calculate age
  const calculateAge = (birthDate: Date, birthYear: number | null): string => {
    if (!birthYear) return '';
    const today = new Date();
    let age = today.getFullYear() - birthYear;
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `(${age} years old)`;
  };

  // Get upcoming birthdays in the month
  const getUpcomingBirthdays = (): BirthdayWithFriend[] => {
    const today = new Date();
    return monthBirthdays
      .filter((birthday: BirthdayWithFriend) => {
        const birthDate = new Date(birthday.birth_date);
        return birthDate >= today;
      })
      .sort((a: BirthdayWithFriend, b: BirthdayWithFriend) => 
        new Date(a.birth_date).getTime() - new Date(b.birth_date).getTime()
      );
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <div className="flex h-full gap-6">
        {/* Left side - Calendar */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              🎂 Birthday Tracker
            </h1>
            <div className="flex gap-2">
              <Dialog open={isAddFriendOpen} onOpenChange={setIsAddFriendOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    👥 Add Friend
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Friend</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateFriend} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={friendFormData.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFriendFormData((prev: CreateFriendInput) => ({ ...prev, name: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={friendFormData.email || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFriendFormData((prev: CreateFriendInput) => ({ 
                            ...prev, 
                            email: e.target.value || null 
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={friendFormData.phone || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFriendFormData((prev: CreateFriendInput) => ({ 
                            ...prev, 
                            phone: e.target.value || null 
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={friendFormData.notes || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setFriendFormData((prev: CreateFriendInput) => ({ 
                            ...prev, 
                            notes: e.target.value || null 
                          }))
                        }
                      />
                    </div>
                    <Button type="submit" disabled={isLoading} className="w-full">
                      {isLoading ? 'Adding...' : 'Add Friend'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={isAddBirthdayOpen} onOpenChange={setIsAddBirthdayOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    🎉 Add Birthday
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Birthday</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateBirthday} className="space-y-4">
                    <div>
                      <Label htmlFor="friend">Friend *</Label>
                      <Select
                        value={birthdayFormData.friend_id.toString()}
                        onValueChange={(value: string) =>
                          setBirthdayFormData((prev: CreateBirthdayInput) => ({ 
                            ...prev, 
                            friend_id: parseInt(value) 
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a friend" />
                        </SelectTrigger>
                        <SelectContent>
                          {friends.map((friend: Friend) => (
                            <SelectItem key={friend.id} value={friend.id.toString()}>
                              {friend.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="birth_date">Birth Date *</Label>
                      <Input
                        id="birth_date"
                        type="date"
                        value={birthdayFormData.birth_date.toISOString().split('T')[0]}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setBirthdayFormData((prev: CreateBirthdayInput) => ({ 
                            ...prev, 
                            birth_date: new Date(e.target.value) 
                          }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="birth_year">Birth Year (optional)</Label>
                      <Input
                        id="birth_year"
                        type="number"
                        value={birthdayFormData.birth_year || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setBirthdayFormData((prev: CreateBirthdayInput) => ({ 
                            ...prev, 
                            birth_year: e.target.value ? parseInt(e.target.value) : null 
                          }))
                        }
                        min="1900"
                        max={new Date().getFullYear()}
                      />
                    </div>
                    <div>
                      <Label htmlFor="reminder_days">Reminder Days Before</Label>
                      <Input
                        id="reminder_days"
                        type="number"
                        value={birthdayFormData.reminder_days}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setBirthdayFormData((prev: CreateBirthdayInput) => ({ 
                            ...prev, 
                            reminder_days: parseInt(e.target.value) || 7 
                          }))
                        }
                        min="0"
                      />
                    </div>
                    <Button type="submit" disabled={isLoading || birthdayFormData.friend_id === 0} className="w-full">
                      {isLoading ? 'Adding...' : 'Add Birthday'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Calendar */}
          <Card className="flex-1 shadow-lg">
            <CardContent className="p-6 h-full">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                onMonthChange={handleMonthChange}
                className="h-full"
                components={{
                  DayContent: ({ date }) => {
                    const dayBirthdays = getBirthdaysForDate(date);
                    return (
                      <div className="relative w-full h-full flex flex-col items-center justify-center">
                        <span className="text-sm">{date.getDate()}</span>
                        {dayBirthdays.length > 0 && (
                          <div className="absolute -bottom-1 w-2 h-2 bg-pink-500 rounded-full animate-pulse" />
                        )}
                      </div>
                    );
                  }
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right side - Month birthdays */}
        <div className="w-80 flex flex-col">
          <Card className="flex-1 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🗓️ {monthNames[selectedMonth - 1]} {selectedYear}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {monthBirthdays.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <p>🎈 No birthdays this month</p>
                    <p className="text-sm mt-2">Add some friends and their birthdays!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {monthBirthdays.map((birthday: BirthdayWithFriend) => (
                      <Card key={birthday.id} className="border-l-4 border-l-pink-400">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{birthday.friend.name}</h3>
                              <p className="text-sm text-gray-600">
                                📅 {new Date(birthday.birth_date).toLocaleDateString('en-US', {
                                  month: 'long',
                                  day: 'numeric'
                                })}
                                {birthday.birth_year && (
                                  <span className="ml-2 text-pink-600">
                                    {calculateAge(new Date(birthday.birth_date), birthday.birth_year)}
                                  </span>
                                )}
                              </p>
                              {birthday.friend.email && (
                                <p className="text-xs text-gray-500 mt-1">
                                  ✉️ {birthday.friend.email}
                                </p>
                              )}
                              {birthday.friend.phone && (
                                <p className="text-xs text-gray-500">
                                  📱 {birthday.friend.phone}
                                </p>
                              )}
                              {birthday.friend.notes && (
                                <p className="text-xs text-gray-600 mt-2 italic">
                                  💭 {birthday.friend.notes}
                                </p>
                              )}
                            </div>
                            <Badge variant="secondary" className="ml-2">
                              {birthday.reminder_days}d reminder
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Upcoming birthdays */}
          <Card className="mt-4 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                ⏰ Upcoming This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {getUpcomingBirthdays().slice(0, 3).map((birthday: BirthdayWithFriend) => (
                  <div key={birthday.id} className="flex items-center justify-between p-2 bg-pink-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{birthday.friend.name}</p>
                      <p className="text-xs text-gray-600">
                        {new Date(birthday.birth_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-pink-600 font-medium">
                        {Math.ceil((new Date(birthday.birth_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                      </p>
                    </div>
                  </div>
                ))}
                {getUpcomingBirthdays().length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-2">
                    No upcoming birthdays this month
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default App;
