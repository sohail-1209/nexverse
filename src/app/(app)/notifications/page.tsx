
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BellRing, Check, Eye, Trash2, Loader2, ListChecks, BellOff, Info, MessageSquare, FileText, AlertTriangle, Wand2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { db, collection, query, where, getDocs, deleteDoc, doc, orderBy as fbOrderBy, updateDoc, writeBatch, onSnapshot, Timestamp } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';

interface UserNotification {
  id: string;
  title: string;
  body: string;
  link?: string;
  timestamp: Timestamp;
  isRead: boolean;
  icon?: string; // Suggests a Lucide icon name
  type?: 'new_answer' | 'new_comment' | 'system_update' | 'verification_status' | 'general_ai' | 'error_report' | string; // For icon mapping
}

const NOTIFICATION_ICONS: { [key: string]: React.ElementType } = {
  new_answer: FileText,
  new_comment: MessageSquare,
  system_update: Info,
  verification_status: Check,
  general_ai: Wand2,
  error_report: AlertTriangle,
  default: BellRing,
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const notificationsCollectionRef = collection(db, `users/${user.uid}/notifications`);
    const q = query(notificationsCollectionRef, fbOrderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedNotifications: UserNotification[] = [];
      querySnapshot.forEach((doc) => {
        fetchedNotifications.push({ id: doc.id, ...doc.data() } as UserNotification);
      });
      setNotifications(fetchedNotifications);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching notifications:", error);
      toast({ title: "Error", description: "Could not fetch notifications.", variant: "destructive" });
      setIsLoading(false);
    });

    return () => unsubscribe(); // Cleanup listener on component unmount
  }, [user]);

  const handleMarkAsRead = async (notificationId: string, currentStatus: boolean) => {
    if (!user) return;
    try {
      const notificationDocRef = doc(db, `users/${user.uid}/notifications`, notificationId);
      await updateDoc(notificationDocRef, { isRead: !currentStatus });
      // No toast needed as UI updates via onSnapshot
    } catch (error) {
      console.error("Error updating notification status:", error);
      toast({ title: "Error", description: "Could not update notification status.", variant: "destructive" });
    }
  };
  
  const handleNotificationClick = async (notification: UserNotification) => {
    if (!user) return;
    try {
      if (!notification.isRead) {
        const notificationDocRef = doc(db, `users/${user.uid}/notifications`, notification.id);
        await updateDoc(notificationDocRef, { isRead: true });
      }
      if (notification.link) {
        router.push(notification.link);
      }
    } catch (error) {
      console.error("Error handling notification click:", error);
      toast({ title: "Error", description: "Could not process notification action.", variant: "destructive" });
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    if (!user) return;
    try {
      const notificationDocRef = doc(db, `users/${user.uid}/notifications`, notificationId);
      await deleteDoc(notificationDocRef);
      toast({ title: 'Notification Deleted', description: 'The notification has been removed.' });
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast({ title: "Error", description: "Could not delete notification.", variant: "destructive" });
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user || notifications.filter(n => !n.isRead).length === 0) return;
    const batch = writeBatch(db);
    notifications.forEach(notification => {
      if (!notification.isRead) {
        const notificationDocRef = doc(db, `users/${user.uid}/notifications`, notification.id);
        batch.update(notificationDocRef, { isRead: true });
      }
    });
    try {
      await batch.commit();
      toast({ title: 'All Marked as Read', description: 'All notifications have been marked as read.' });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast({ title: "Error", description: "Could not mark all notifications as read.", variant: "destructive" });
    }
  };

  const handleDeleteAllNotifications = async () => {
    if (!user || notifications.length === 0) return;
    const batch = writeBatch(db);
    notifications.forEach(notification => {
      const notificationDocRef = doc(db, `users/${user.uid}/notifications`, notification.id);
      batch.delete(notificationDocRef);
    });
    try {
      await batch.commit();
      toast({ title: 'All Deleted', description: 'All notifications have been deleted.' });
    } catch (error) {
      console.error("Error deleting all notifications:", error);
      toast({ title: "Error", description: "Could not delete all notifications.", variant: "destructive" });
    }
  };

  const getNotificationIcon = (type?: string) => {
    if (type && NOTIFICATION_ICONS[type]) {
      return NOTIFICATION_ICONS[type];
    }
    return NOTIFICATION_ICONS.default;
  };


  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }

  if (!user) {
    return (
        <Card className="text-center">
            <CardHeader>
                <CardTitle>Login Required</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-4">Please log in to see your notifications.</p>
                <Button asChild>
                    <Link href="/auth/login">Log In</Link>
                </Button>
            </CardContent>
        </Card>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <CardTitle className="font-headline text-3xl flex items-center gap-2"><BellRing className="h-8 w-8 text-primary" /> My Notifications</CardTitle>
              <CardDescription>Stay updated with the latest activities and alerts.</CardDescription>
            </div>
            {notifications.length > 0 && (
              <div className="flex gap-2 mt-4 md:mt-0">
                <Button onClick={handleMarkAllAsRead} variant="outline" size="sm" disabled={notifications.filter(n => !n.isRead).length === 0}>
                  <ListChecks className="mr-2 h-4 w-4" /> Mark all as read
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" /> Clear all
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear All Notifications?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete all your notifications? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAllNotifications} className="bg-destructive hover:bg-destructive/90">Delete All</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((notification) => {
            const NotificationIcon = getNotificationIcon(notification.type);
            return (
              <Card 
                key={notification.id} 
                className={cn(
                  "hover:shadow-md transition-shadow duration-200",
                  !notification.isRead && "border-primary border-2",
                  notification.link && "cursor-pointer"
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent className="pt-6 flex items-start gap-4">
                  <div className={cn("p-2 rounded-full", notification.isRead ? "bg-muted" : "bg-primary/10")}>
                     <NotificationIcon className={cn("h-6 w-6", notification.isRead ? "text-muted-foreground" : "text-primary")} />
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <h3 className={cn("font-semibold", !notification.isRead && "text-primary")}>{notification.title}</h3>
                      {!notification.isRead && <Badge variant="default" className="text-xs">New</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{notification.body}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.timestamp?.toDate ? notification.timestamp.toDate().toLocaleString() : 'Recently'}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-1 items-center">
                     <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notification.id, notification.isRead); }}
                        title={notification.isRead ? "Mark as unread" : "Mark as read"}
                      >
                        <Eye className="mr-1 h-4 w-4" /> {notification.isRead ? "Unread" : "Read"}
                      </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={(e) => e.stopPropagation()} title="Delete Notification">
                                <Trash2 className="h-4 w-4" />
                           </Button>
                        </AlertDialogTrigger>
                         <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete Notification?</AlertDialogTitle>
                                <AlertDialogDescription>
                                Are you sure you want to delete this notification titled &quot;{notification.title}&quot;?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={(e) => { e.stopPropagation(); handleDeleteNotification(notification.id);}} className="bg-destructive hover:bg-destructive/90">
                                Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center">
            <BellOff className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl font-semibold">No Notifications Yet</p>
            <p className="text-muted-foreground">
              You currently have no notifications. We&apos;ll let you know when something new happens!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
