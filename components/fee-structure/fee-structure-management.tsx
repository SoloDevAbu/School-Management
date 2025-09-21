"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Plus, Edit, IndianRupee, Trash2 } from "lucide-react"
import { CreateFeeStructureDialog } from "./create-fee-structure-dialog"
import { EditFeeStructureDialog } from "./edit-fee-structure-dialog"
import { useToast } from "@/hooks/use-toast"

interface Batch {
  id: string
  name: string
  startYear: number
  endYear: number
  isActive: boolean
}

interface Class {
  id: string
  name: string
  section: string | null
  batchId: string
  batch: {
    name: string
    startYear: number
    endYear: number
  }
}

interface FeeStructure {
  id: string
  name: string
  amount: string
  type: string
  isActive: boolean
  dueDate: string | null
  createdAt: string
  class: {
    id: string
    name: string
    section: string | null
    batch: {
      name: string
      startYear: number
      endYear: number
    }
  }
}

export function FeeStructureManagement() {
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedBatchId, setSelectedBatchId] = useState<string>("all")
  const [selectedClassId, setSelectedClassId] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedFeeStructure, setSelectedFeeStructure] = useState<FeeStructure | null>(null)
  const [feeStructureToDelete, setFeeStructureToDelete] = useState<FeeStructure | null>(null)
  const { toast } = useToast()

  const fetchBatches = async () => {
    try {
      const response = await fetch("/api/batches")
      if (response.ok) {
        const data = await response.json()
        const activeBatches = data.filter((batch: Batch) => batch.isActive)
        activeBatches.sort((a: Batch, b: Batch) => b.startYear - a.startYear)

        setBatches(activeBatches)

        if (activeBatches.length > 0) {
          setSelectedBatchId(activeBatches[0].id);
        } else {
          setSelectedBatchId("all");
        }
      }
    } catch (error) {
      console.error("Error fetching batches:", error)
    }
  }

  const fetchClasses = async () => {
    try {
      const response = await fetch("/api/classes")
      if (response.ok) {
        const data = await response.json()
        setClasses(data)
      }
    } catch (error) {
      console.error("Error fetching classes:", error)
    }
  }

  const fetchFeeStructures = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedBatchId !== "all") params.append("batchId", selectedBatchId)
      if (selectedClassId !== "all") params.append("classId", selectedClassId)

      const response = await fetch(`/api/fee-structures?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setFeeStructures(data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch fee structures",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBatches()
    fetchClasses()
  }, [])

  useEffect(() => {
    fetchFeeStructures()
  }, [selectedBatchId, selectedClassId])

  const handleEdit = (feeStructure: FeeStructure) => {
    setSelectedFeeStructure(feeStructure)
    setEditDialogOpen(true)
  }

  const handleDeleteClick = (feeStructure: FeeStructure) => {
    setFeeStructureToDelete(feeStructure)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!feeStructureToDelete) return

    try {
      const response = await fetch(`/api/fee-structures/${feeStructureToDelete.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Fee structure deleted successfully",
        })
        fetchFeeStructures()
        setDeleteDialogOpen(false)
        setFeeStructureToDelete(null)
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete fee structure")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete fee structure",
        variant: "destructive",
      })
    }
  }

  const handleToggleActive = async (feeStructureId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/fee-structures/${feeStructureId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !isActive }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Fee structure ${!isActive ? "activated" : "deactivated"} successfully`,
        })
        fetchFeeStructures()
      } else {
        throw new Error("Failed to update fee structure")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update fee structure status",
        variant: "destructive",
      })
    }
  }

  const filteredClasses = classes.filter((cls) => (selectedBatchId === "all" ? true : cls.batchId === selectedBatchId))

  const getFeeTypeColor = (type: string) => {
    switch (type) {
      case "MONTHLY":
        return "default"
      case "QUARTERLY":
        return "secondary"
      case "HALF_YEARLY":
        return "outline"
      case "YEARLY":
        return "destructive"
      case "ONE_TIME":
        return "secondary"
      case "TUITION":
        return "default"
      case "LIBRARY":
        return "secondary"
      case "LABORATORY":
        return "destructive"
      case "SPORTS":
        return "outline"
      case "TRANSPORT":
        return "secondary"
      case "EXAMINATION":
        return "default"
      case "DEVELOPMENT":
        return "secondary"
      case "MISCELLANEOUS":
        return "outline"
      default:
        return "secondary"
    }
  }

  const formatAmount = (amount: string) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(Number.parseFloat(amount))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading fee structures...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold">Fee Structures</h2>
          {/* <p className="text-sm text-gray-600">Define fees for each class and batch</p> */}
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Fee Structure
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
              <SelectTrigger>
                <SelectValue placeholder="All Batches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Batches</SelectItem>
                {batches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id}>
                    {batch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger>
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {filteredClasses.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                    {cls.section && ` - ${cls.section}`}
                    {cls.batch && ` - ${cls.batch.name}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-sm text-gray-600 flex items-center">
              <IndianRupee className="mr-1 h-4 w-4" />
              {feeStructures.length} fee structures found
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fee Structures Grid */}
      {feeStructures.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IndianRupee className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No fee structures found</h3>
            <p className="text-gray-600 text-center mb-4">
              {selectedBatchId !== "all" || selectedClassId !== "all"
                ? "No fee structures found for the selected filters."
                : "Add your first fee structure to start managing fees."}
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Fee Structure
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {feeStructures.map((feeStructure) => (
            <Card key={feeStructure.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{feeStructure.name}</CardTitle>
                  <Badge variant={feeStructure.isActive ? "default" : "secondary"}>
                    {feeStructure.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-green-600">{formatAmount(feeStructure.amount)}</div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant={getFeeTypeColor(feeStructure.type)}>{feeStructure.type.replace("_", " ")}</Badge>
                  <div className="text-sm text-gray-600">
                    {feeStructure.class.name}
                    {feeStructure.class.section && ` - ${feeStructure.class.section}`}
                  </div>
                </div>

                <div className="text-sm text-gray-600">{feeStructure.class.batch.name}</div>

                {feeStructure.dueDate && (
                  <div className="text-sm text-gray-600">
                    Due: {new Date(feeStructure.dueDate).toLocaleDateString()}
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  Created {new Date(feeStructure.createdAt).toLocaleDateString()}
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(feeStructure)} className="flex-1">
                    <Edit className="mr-1 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant={feeStructure.isActive ? "destructive" : "default"}
                    size="sm"
                    onClick={() => handleToggleActive(feeStructure.id, feeStructure.isActive)}
                    className="flex-1"
                  >
                    {feeStructure.isActive ? "Deactivate" : "Activate"}
                  </Button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteClick(feeStructure)}
                  className="w-full text-red-600 hover:text-red-700"
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  Delete
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateFeeStructureDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchFeeStructures}
        classes={classes}
      />

      <EditFeeStructureDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        feeStructure={selectedFeeStructure}
        onSuccess={fetchFeeStructures}
        classes={classes}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Fee Structure</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{feeStructureToDelete?.name}"? This action cannot be undone.
              {feeStructureToDelete && (
                <div className="mt-2 text-sm">
                  <strong>Amount:</strong> {formatAmount(feeStructureToDelete.amount)}
                  <br />
                  <strong>Class:</strong> {feeStructureToDelete.class.name}
                  {feeStructureToDelete.class.section && ` - ${feeStructureToDelete.class.section}`}
                  <br />
                  <strong>Batch:</strong> {feeStructureToDelete.class.batch.name}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete Fee Structure
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
