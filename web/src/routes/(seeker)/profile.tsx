import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { axios } from '@/lib/axios';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import { useTRPC } from '@/utils/trpc';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { CloudUploadIcon, MailIcon } from 'lucide-react';
import React, { Suspense, useRef, useState } from 'react';
import { Link } from 'react-router';

export default function Profile() {
  const user = useAuth();

  return (
    <div className='w-xl mx-auto flex flex-col'>
      <header className='flex justify-between items-center'>
        <h2 className='text-4xl font-bold'>{user?.displayName}</h2>
        <Avatar className='size-14'>
          <AvatarImage src={user?.imageURL ?? undefined} alt='' />
          <AvatarFallback className='text-xl font-bold'>
            {user?.displayName.charAt(0)}
          </AvatarFallback>
        </Avatar>
      </header>
      <section className='my-3'>
        <div className='flex py-4 pr-1 items-center'>
          <div className='grow shrink space-y-2'>
            <div className='flex items-center gap-3'>
              <MailIcon />
              <span>{user?.email}</span>
            </div>
          </div>
        </div>
      </section>
      <section className='my-3'>
        <div className='mb-3 flex items-center  justify-between'>
          <h3 className='text-xl font-bold'>Resume</h3>
        </div>
        <div className='w-full'>
          <Suspense fallback='Loading...'>
            <SummurySection />
          </Suspense>
        </div>
      </section>
    </div>
  );
}

function SummurySection() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.getUserResume.queryOptions());
  return data != null ? (
    <Button asChild>
      <Link to={data.file.uri} target='_blank' rel='noopener noreferrer'>
        View resume
      </Link>
    </Button>
  ) : (
    <UpsertUserResume />
  );
}

function UpsertUserResume() {
  const trpc = useTRPC();
  const { mutate } = useMutation(trpc.upsertUserResume.mutationOptions());
  return (
    <Card>
      <CardContent>
        <UploadDropzone
          onUploadComplete={data => {
            mutate({ fileKey: data.fileKey });
          }}
        />
      </CardContent>
    </Card>
  );
}

function UploadDropzone({
  onUploadComplete,
  onUploadError,
}: {
  onUploadComplete?: (res: any) => void;
  onUploadError?: (error: any) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  async function handleFileSelect(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    try {
      setIsUploading(true);
      const res = await axios.post('/upload/resume.json', formData, {
        onUploadProgress: event => {
          if (event.total) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setProgress(percent);
          }
        },
      });
      setProgress(100);
      setTimeout(() => setIsUploading(false), 500);
      if (onUploadComplete) {
        onUploadComplete(res.data);
      }
    } catch (error) {
      if (onUploadError) {
        onUploadError(error);
      }
      setIsUploading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file != null) {
      handleFileSelect(file);
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLInputElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent<HTMLInputElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file != null) {
      handleFileSelect(file);
    }
  }

  return (
    <div
      className={cn(
        'border-2 border-dashed p-5 rounded-xl flex flex-col items-center gap-2',
        isDragging && 'border-blue-500 bg-blue-50'
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CloudUploadIcon className='size-10' />
      <p>Choose a resume or drag and drop</p>
      {!isUploading ? (
        <Button variant={'outline'} onClick={() => fileRef.current?.click()}>
          Choose a resume
        </Button>
      ) : (
        <Progress value={progress} />
      )}
      <input
        ref={fileRef}
        onChange={handleFileChange}
        type='file'
        hidden
        className='sr-only'
      />
    </div>
  );
}
