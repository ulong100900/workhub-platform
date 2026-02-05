import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { AlertCircle, CheckCircle, Info, XCircle } from "lucide-react"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
        success:
          "border-green-500/50 text-green-700 dark:text-green-400 dark:border-green-500 [&>svg]:text-green-500",
        warning:
          "border-yellow-500/50 text-yellow-700 dark:text-yellow-400 dark:border-yellow-500 [&>svg]:text-yellow-500",
        info: "border-blue-500/50 text-blue-700 dark:text-blue-400 dark:border-blue-500 [&>svg]:text-blue-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

// Компоненты с иконками
const AlertWithIcon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    icon?: React.ReactNode
    title?: string
    description?: string
  }
>(({ className, icon, title, description, children, ...props }, ref) => {
  return (
    <Alert ref={ref} className={className} {...props}>
      {icon && <div className="flex-shrink-0">{icon}</div>}
      <div className="flex-1">
        {title && <AlertTitle>{title}</AlertTitle>}
        {description && <AlertDescription>{description}</AlertDescription>}
        {children}
      </div>
    </Alert>
  )
})
AlertWithIcon.displayName = "AlertWithIcon"

// Предопределенные алерты
const SuccessAlert = ({ title, description, ...props }: any) => (
  <AlertWithIcon
    variant="success"
    icon={<CheckCircle className="h-4 w-4" />}
    title={title}
    description={description}
    {...props}
  />
)

const ErrorAlert = ({ title, description, ...props }: any) => (
  <AlertWithIcon
    variant="destructive"
    icon={<XCircle className="h-4 w-4" />}
    title={title}
    description={description}
    {...props}
  />
)

const WarningAlert = ({ title, description, ...props }: any) => (
  <AlertWithIcon
    variant="warning"
    icon={<AlertCircle className="h-4 w-4" />}
    title={title}
    description={description}
    {...props}
  />
)

const InfoAlert = ({ title, description, ...props }: any) => (
  <AlertWithIcon
    variant="info"
    icon={<Info className="h-4 w-4" />}
    title={title}
    description={description}
    {...props}
  />
)

export {
  Alert,
  AlertTitle,
  AlertDescription,
  SuccessAlert,
  ErrorAlert,
  WarningAlert,
  InfoAlert,
}