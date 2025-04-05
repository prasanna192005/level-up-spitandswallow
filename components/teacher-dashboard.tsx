"use client"

import { useState } from "react"
import { Bell, ChevronDown, FileCheck, Home, Menu, MessageSquare, Upload } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function TeacherDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  
  // Add new state handlers
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  // Add this state near other state declarations
  const [pdfPreview, setPdfPreview] = useState<string | null>(null)
  
  // Handle paper approval/rejection
  const handlePaperAction = async (action: 'approve' | 'reject', examId: string) => {
    try {
      // Here you would make an API call to your backend
      const response = await fetch('/api/paper-requests/' + examId, {
        method: 'POST',
        body: JSON.stringify({ action }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) throw new Error('Failed to process request')
      
      // Refresh the data or update UI accordingly
      alert(`Paper ${action}d successfully`)
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to process request')
    }
  }

  // Handle file upload
  const handleFileUpload = async (examId: string) => {
    if (!selectedFile) {
      alert('Please select a PDF file first')
      return
    }

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('examId', examId)

      const response = await fetch('/api/upload-paper', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Upload failed')
      
      alert('Paper uploaded successfully')
      setSelectedFile(null)
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to upload paper')
    }
  }

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file)
      // Create URL for preview
      const fileUrl = URL.createObjectURL(file)
      setPdfPreview(fileUrl)
    } else {
      alert('Please select a PDF file')
    }
  }

  // Add cleanup function
  const cleanupPreview = () => {
    if (pdfPreview) {
      URL.revokeObjectURL(pdfPreview)
      setPdfPreview(null)
    }
    setSelectedFile(null)
  }

  // Replace the existing Dialog content with this updated version
  <Dialog onOpenChange={(open) => !open && cleanupPreview()}>
    <DialogTrigger asChild>
      <Button size="sm">Upload Paper</Button>
    </DialogTrigger>
    <DialogContent className="max-w-4xl">
      <DialogHeader>
        <DialogTitle>Upload Question Paper</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="paper-file">Question Paper (PDF only)</Label>
          <Input
            id="paper-file"
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
          />
        </div>
        {pdfPreview && (
          <div className="mt-4 h-[500px] w-full">
            <iframe
              src={pdfPreview}
              className="h-full w-full rounded-md border"
            />
          </div>
        )}
        <Button 
          onClick={() => {
            handleFileUpload('exam-1')
            cleanupPreview()
          }}
          disabled={!selectedFile}
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload Paper
        </Button>
      </div>
    </DialogContent>
  </Dialog>

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-[240px] p-0">
          <div className="flex h-full flex-col bg-white">
            <div className="border-b p-4">
              <Link href="#" className="flex items-center gap-2 font-semibold">
                <FileCheck className="h-5 w-5" />
                <span>Teacher Portal</span>
              </Link>
            </div>
            <nav className="flex-1 overflow-auto py-2">
              <div className="px-3 py-2">
                <h2 className="mb-2 px-4 text-xs font-semibold uppercase tracking-tight">Navigation</h2>
                <div className="space-y-1">
                  <Link
                    href="#"
                    className="flex items-center gap-3 rounded-md bg-muted px-4 py-2 text-sm font-medium transition-colors hover:text-primary"
                  >
                    <Home className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link
                    href="#"
                    className="flex items-center gap-3 rounded-md px-4 py-2 text-sm font-medium transition-colors hover:text-primary"
                  >
                    <FileCheck className="h-4 w-4" />
                    Approved Requests
                  </Link>
                  <Link
                    href="#"
                    className="flex items-center gap-3 rounded-md px-4 py-2 text-sm font-medium transition-colors hover:text-primary"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Submitted Papers
                  </Link>
                  <Link
                    href="#"
                    className="flex items-center gap-3 rounded-md px-4 py-2 text-sm font-medium transition-colors hover:text-primary"
                  >
                    <Bell className="h-4 w-4" />
                    Notifications
                    <Badge className="ml-auto flex h-6 w-6 items-center justify-center rounded-full">4</Badge>
                  </Link>
                </div>
              </div>
            </nav>
          </div>
        </SheetContent>
      </Sheet>

      {/* Notification panel */}
      <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <SheetContent className="w-[320px] sm:w-[420px]">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b pb-4">
              <h2 className="text-lg font-semibold">Notifications</h2>
              <Button variant="ghost" size="sm">
                Mark all as read
              </Button>
            </div>
            <div className="flex-1 overflow-auto py-4">
              <div className="space-y-4">
                <div className="rounded-lg border bg-yellow-50 p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">Approval pending</p>
                      <p className="text-sm text-muted-foreground">Mid-Sem Computer Science</p>
                    </div>
                    <Badge variant="outline" className="bg-yellow-100">
                      Pending
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">2 hours ago</p>
                </div>
                <div className="rounded-lg border bg-green-50 p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">Paper submitted successfully</p>
                      <p className="text-sm text-muted-foreground">End-Sem Mathematics</p>
                    </div>
                    <Badge variant="outline" className="bg-green-100">
                      Success
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Yesterday</p>
                </div>
                <div className="rounded-lg border bg-blue-50 p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">New paper request</p>
                      <p className="text-sm text-muted-foreground">End-Sem Physics</p>
                    </div>
                    <Badge variant="outline" className="bg-blue-100">
                      New
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">2 days ago</p>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">Paper verified</p>
                      <p className="text-sm text-muted-foreground">Mid-Sem Chemistry</p>
                    </div>
                    <Badge variant="outline">Verified</Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">3 days ago</p>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col md:grid md:grid-cols-[240px_1fr]">
        {/* Desktop sidebar */}
        <div className="hidden border-r bg-white md:block">
          <div className="flex h-full max-h-screen flex-col">
            <div className="border-b p-4">
              <Link href="#" className="flex items-center gap-2 font-semibold">
                <FileCheck className="h-5 w-5" />
                <span>Teacher Portal</span>
              </Link>
            </div>
            <nav className="flex-1 overflow-auto py-2">
              <div className="px-3 py-2">
                <h2 className="mb-2 px-4 text-xs font-semibold uppercase tracking-tight">Navigation</h2>
                <div className="space-y-1">
                  <Link
                    href="#"
                    className="flex items-center gap-3 rounded-md bg-muted px-4 py-2 text-sm font-medium transition-colors hover:text-primary"
                  >
                    <Home className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link
                    href="#"
                    className="flex items-center gap-3 rounded-md px-4 py-2 text-sm font-medium transition-colors hover:text-primary"
                  >
                    <FileCheck className="h-4 w-4" />
                    Approved Requests
                  </Link>
                  <Link
                    href="#"
                    className="flex items-center gap-3 rounded-md px-4 py-2 text-sm font-medium transition-colors hover:text-primary"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Submitted Papers
                  </Link>
                  <Link
                    href="#"
                    className="flex items-center gap-3 rounded-md px-4 py-2 text-sm font-medium transition-colors hover:text-primary"
                  >
                    <Bell className="h-4 w-4" />
                    Notifications
                    <Badge className="ml-auto flex h-6 w-6 items-center justify-center rounded-full">4</Badge>
                  </Link>
                </div>
              </div>
            </nav>
          </div>
        </div>

        <div className="flex flex-1 flex-col">
          {/* Top navbar */}
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-white px-4 md:px-6">
            <Button variant="outline" size="icon" className="md:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
            <h1 className="text-lg font-semibold md:text-xl">Teacher Dashboard</h1>
            <div className="ml-auto flex items-center gap-4">
              <Button variant="outline" size="icon" className="relative" onClick={() => setNotificationsOpen(true)}>
                <Bell className="h-5 w-5" />
                <span className="sr-only">Toggle notifications</span>
                <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-red-600"></span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    Prof. Sharma
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <div className="grid gap-6">
              {/* Incoming Paper Requests */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Incoming Paper Requests</CardTitle>
                    <CardDescription>Pending approval from you</CardDescription>
                  </div>
                  <Badge className="h-6 px-3">3 Pending</Badge>
                </CardHeader>
                <CardContent>
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Exam Name</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Deadline</TableHead>
                          <TableHead>Sent By</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow className="bg-muted/50">
                          <TableCell className="font-medium">Mid-Semester</TableCell>
                          <TableCell>Computer Science</TableCell>
                          <TableCell>Apr 15, 2025</TableCell>
                          <TableCell>COE Office</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                Approve
                              </Button>
                              <Button size="sm" variant="destructive">
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">End-Semester</TableCell>
                          <TableCell>Physics</TableCell>
                          <TableCell>May 20, 2025</TableCell>
                          <TableCell>Dean Academics</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handlePaperAction('approve', 'exam-1')}
                              >
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handlePaperAction('reject', 'exam-1')}
                              >
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        <TableRow className="bg-muted/50">
                          <TableCell className="font-medium">Quiz 2</TableCell>
                          <TableCell>Mathematics</TableCell>
                          <TableCell>Apr 10, 2025</TableCell>
                          <TableCell>HOD Mathematics</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                Approve
                              </Button>
                              <Button size="sm" variant="destructive">
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* My Approved Paper Requests */}
              <Card>
                <CardHeader>
                  <CardTitle>My Approved Paper Requests</CardTitle>
                  <CardDescription>Papers you need to create</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Exam Name</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Deadline</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow className="bg-muted/50">
                          <TableCell className="font-medium">End-Semester</TableCell>
                          <TableCell>Mathematics</TableCell>
                          <TableCell>May 25, 2025</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                              In Progress
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm">Edit Paper</Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Mid-Semester</TableCell>
                          <TableCell>Chemistry</TableCell>
                          <TableCell>Apr 18, 2025</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-red-100 text-red-800">
                              Not Started
                            </Badge>
                          </TableCell>
                      
                          <TableCell className="text-right">
                          <Dialog>
                          <DialogTrigger asChild>
                          <Button size="sm">Upload Paper</Button>
                          </DialogTrigger>
                          <DialogContent>
                          <DialogHeader>
                          <DialogTitle>Upload Question Paper</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                          <Label htmlFor="paper-file">Question Paper (PDF only)</Label>
                          <Input
                          id="paper-file"
                          type="file"
                          accept=".pdf"
                          onChange={handleFileSelect}
                          />
                          </div>
                          <Button 
                          onClick={() => handleFileUpload('exam-1')}
                          disabled={!selectedFile}
                          >
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Paper
                          </Button>
                          </div>
                          </DialogContent>
                          </Dialog>
                          </TableCell>
                        </TableRow>
                        <TableRow className="bg-muted/50">
                          <TableCell className="font-medium">Quiz 1</TableCell>
                          <TableCell>Physics</TableCell>
                          <TableCell>Apr 5, 2025</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-100 text-green-800">
                              Submitted
                            </Badge>
                          </TableCell>
                        
                          <TableCell className="text-right">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  View
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl">
                                <DialogHeader>
                                  <DialogTitle>View Question Paper</DialogTitle>
                                </DialogHeader>
                                <div className="h-[600px] w-full">
                                  <iframe
                                    src="/sample.pdf" // Replace with actual PDF URL when connected to backend
                                    className="h-full w-full rounded-md border"
                                  />
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* My Submitted Papers */}
              <Card>
                <CardHeader>
                  <CardTitle>My Submitted Papers</CardTitle>
                  <CardDescription>Papers you have already submitted</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Subject</TableHead>
                          <TableHead>Exam</TableHead>
                          <TableHead>Submitted On</TableHead>
                          <TableHead>Blockchain Hash</TableHead>
                          <TableHead>Verified By</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow className="bg-muted/50">
                          <TableCell className="font-medium">Physics</TableCell>
                          <TableCell>Quiz 1</TableCell>
                          <TableCell>Mar 28, 2025</TableCell>
                          <TableCell className="font-mono text-xs">0x7a9d...3f21</TableCell>
                          <TableCell>Rahul Singh (ID: 2023045)</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Computer Science</TableCell>
                          <TableCell>Assignment 2</TableCell>
                          <TableCell>Mar 15, 2025</TableCell>
                          <TableCell className="font-mono text-xs">0x3e7b...9c42</TableCell>
                          <TableCell>Priya Sharma (ID: 2023078)</TableCell>
                        </TableRow>
                        <TableRow className="bg-muted/50">
                          <TableCell className="font-medium">Mathematics</TableCell>
                          <TableCell>Quiz 2</TableCell>
                          <TableCell>Feb 20, 2025</TableCell>
                          <TableCell className="font-mono text-xs">0x9f4c...2d18</TableCell>
                          <TableCell>Amit Kumar (ID: 2023112)</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

