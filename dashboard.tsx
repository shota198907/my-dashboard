"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Bell, Calendar as CalendarIcon, Target, TrendingUp, List, Settings, Plus, Minus } from "lucide-react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isWeekend, differenceInDays } from 'date-fns'

type KPI = {
  id: string
  name: string
  target: number
  current: number
  color: string
}

const initialKPIs: KPI[] = [
  { id: '1', name: "アポイント数", target: 50, current: 20, color: "bg-blue-500" },
  { id: '2', name: "粗利 (万円)", target: 1000, current: 350, color: "bg-green-500" },
  { id: '3', name: "商談数", target: 30, current: 12, color: "bg-purple-500" },
]

export default function Dashboard() {
  const [kpis, setKPIs] = useState<KPI[]>(initialKPIs)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [showAlert, setShowAlert] = useState(false)

  const today = new Date()
  const startDate = startOfMonth(selectedDate)
  const endDate = endOfMonth(selectedDate)

  const isWorkday = (date: Date) => !isWeekend(date)

  const getRemainingWorkdays = (start: Date, end: Date) => {
    return eachDayOfInterval({ start, end }).filter(isWorkday).length
  }

  const updateKPI = (id: string, value: number) => {
    setKPIs(kpis.map(kpi => 
      kpi.id === id ? { ...kpi, current: Math.max(0, kpi.current + value) } : kpi
    ))
  }

  const addNewKPI = () => {
    const newId = (parseInt(kpis[kpis.length - 1].id) + 1).toString()
    setKPIs([...kpis, { id: newId, name: "新しいKPI", target: 0, current: 0, color: "bg-gray-500" }])
  }

  const updateKPISettings = (id: string, field: keyof KPI, value: string | number) => {
    setKPIs(kpis.map(kpi => 
      kpi.id === id ? { ...kpi, [field]: value } : kpi
    ))
  }

  useEffect(() => {
    setShowAlert(kpis.some(kpi => (kpi.current / kpi.target) < 0.5))
  }, [kpis])

  const calculateDailyTargets = (date: Date) => {
    if (!isWorkday(date) || date < today) return null
    const remainingDays = getRemainingWorkdays(date, endDate)
    return kpis.map(kpi => ({
      name: kpi.name,
      daily: ((kpi.target - kpi.current) / remainingDays).toFixed(1),
      color: kpi.color
    }))
  }

  const getProgressComment = (kpi: KPI) => {
    const daysPassed = differenceInDays(today, startDate) + 1
    const daysInMonth = differenceInDays(endDate, startDate) + 1
    const expectedProgress = (daysPassed / daysInMonth) * kpi.target
    const actualProgress = kpi.current

    if (actualProgress >= expectedProgress) {
      return `順調です！目標を上回っています。`
    } else {
      const deficit = expectedProgress - actualProgress
      return `目標より${deficit.toFixed(1)}${kpi.name}遅れています。頑張りましょう！`
    }
  }

  const getCalendarComment = (date: Date) => {
    const dailyTargets = calculateDailyTargets(date)
    if (!dailyTargets) return null

    const appointmentsKPI = dailyTargets.find(t => t.name === "アポイント数")
    const grossProfitKPI = dailyTargets.find(t => t.name === "粗利 (万円)")

    let comment = ""
    if (appointmentsKPI) {
      comment += `アポは残り${appointmentsKPI.daily}件です！`
    }
    if (grossProfitKPI) {
      comment += ` 粗利は毎日${grossProfitKPI.daily}万円獲得しないと間に合いません！`
    }
    return comment
  }

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-bold mb-8 text-gray-800">営業KPIダッシュボード</h1>
      
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 gap-4">
          <TabsTrigger value="overview" className="text-lg">概要</TabsTrigger>
          <TabsTrigger value="calendar" className="text-lg">カレンダー</TabsTrigger>
          <TabsTrigger value="input" className="text-lg">データ入力</TabsTrigger>
          <TabsTrigger value="settings" className="text-lg">設定</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {kpis.map((kpi) => (
              <Card key={kpi.id} className="overflow-hidden shadow-lg transition-shadow duration-300 hover:shadow-xl">
                <CardHeader className={`${kpi.color} text-white`}>
                  <CardTitle className="flex justify-between items-center text-xl">
                    <span>{kpi.name}</span>
                    <Target className="h-6 w-6" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="text-4xl font-bold mb-4">{kpi.current} / {kpi.target}</div>
                  <Progress 
                    value={(kpi.current / kpi.target) * 100} 
                    className="h-3 mb-4"
                  />
                  <div className="text-sm text-gray-600 mb-4">
                    達成率: {((kpi.current / kpi.target) * 100).toFixed(1)}%
                  </div>
                  <div className="bg-yellow-100 p-4 rounded-lg">
                    <div className="font-semibold text-yellow-800 mb-2">
                      残り{getRemainingWorkdays(today, endDate)}営業日の目標
                    </div>
                    <div className="text-xl font-bold text-yellow-900">
                      1日あたり: {((kpi.target - kpi.current) / getRemainingWorkdays(today, endDate)).toFixed(1)} {kpi.name}
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-gray-700">
                    {getProgressComment(kpi)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {showAlert && (
            <Alert variant="destructive" className="shadow-md">
              <Bell className="h-5 w-5" />
              <AlertTitle className="text-lg">注意</AlertTitle>
              <AlertDescription className="text-base">
                一部のKPIが目標の50%を下回っています。行動計画を見直してください。
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="calendar">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex justify-between items-center text-2xl">
                <span>活動カレンダー</span>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}>
                    前月
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}>
                    翌月
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {['日', '月', '火', '水', '木', '金', '土'].map(day => (
                  <div key={day} className="text-center font-bold text-gray-600">{day}</div>
                ))}
                {eachDayOfInterval({ start: startDate, end: endDate }).map((date, index) => {
                  const dailyTargets = calculateDailyTargets(date);
                  const isPast = date < today;
                  const isCurrentMonth = isSameMonth(date, selectedDate);
                  const comment = getCalendarComment(date);
                  return (
                    <div
                      key={index}
                      className={`p-2 border rounded ${
                        !isCurrentMonth ? 'bg-gray-100 text-gray-400' :
                        isPast ? 'bg-gray-200' : 
                        isWorkday(date) ? 'bg-white' : 'bg-gray-100'
                      } transition-colors duration-200 hover:bg-gray-50`}
                    >
                      <div className={`text-right text-sm mb-1 ${isPast ? 'text-gray-500' : ''}`}>
                        {date.getDate()}
                      </div>
                      {dailyTargets && (
                        <div className="space-y-1">
                          {dailyTargets.map((target, idx) => (
                            <div key={idx} className={`text-xs ${target.color.replace('bg-', 'text-')} font-semibold`}>
                              {target.name}: {target.daily}
                            </div>
                          ))}
                        </div>
                      )}
                      {comment && (
                        <div className="mt-2 text-xs text-red-600 font-semibold">
                          {comment}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="input">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">データ入力</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {kpis.map((kpi) => (
                  <div key={kpi.id} className="flex items-center space-x-4">
                    <div className={`w-4 h-4 rounded-full ${kpi.color}`}></div>
                    <span className="w-1/3 font-semibold">{kpi.name}</span>
                    <div className="flex items-center space-x-2">
                      <Button onClick={() => updateKPI(kpi.id, -1)} variant="outline" size="icon">
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        value={kpi.current}
                        onChange={(e) => updateKPI(kpi.id, parseInt(e.target.value) - kpi.current)}
                        className="w-20 text-center"
                      />
                      <Button onClick={() => updateKPI(kpi.id, 1)} variant="outline" size="icon">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">KPI設定</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {kpis.map((kpi) => (
                  <div key={kpi.id} className="flex items-center space-x-4">
                    <Input
                      value={kpi.name}
                      onChange={(e) => updateKPISettings(kpi.id, 'name', e.target.value)}
                      className="w-1/3"
                    />
                    <Input
                      type="number"
                      value={kpi.target}
                      onChange={(e) => updateKPISettings(kpi.id, 'target', parseInt(e.target.value))}
                      className="w-1/4"
                      placeholder="目標値"
                    />
                    <Input
                      type="color"
                      value={kpi.color.replace('bg-', '#')}
                      onChange={(e) => updateKPISettings(kpi.id, 'color', `bg-[${e.target.value}]`)}
                      className="w-16 h-10"
                    />
                  </div>
                ))}
                <Button onClick={addNewKPI} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" /> 新しいKPIを追加
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-lg mt-6">
            <CardHeader>
              <CardTitle className="text-2xl">期間設定</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Input
                  type="date"
                  value={format(startDate, 'yyyy-MM-dd')}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  
                  className="w-1/3"
                />
                <span className="text-gray-600">から</span>
                <Input
                  type="date"
                  value={format(endDate, 'yyyy-MM-dd')}
                  className="w-1/3"
                  disabled
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}